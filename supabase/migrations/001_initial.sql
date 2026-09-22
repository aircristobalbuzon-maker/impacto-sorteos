create extension if not exists pgcrypto;

create type raffle_status as enum ('DRAFT','ACTIVE','PAUSED','SALES_CLOSED','DRAWING','FINISHED');
create type payment_status as enum ('PENDING','APPROVED','REJECTED');
create type ticket_status as enum ('PENDING','ACTIVE','WINNER','VOID');

create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null check (role in ('OWNER','ADMIN')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table raffles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  banner_url text,
  price_cents integer not null check (price_cents > 0),
  starts_at timestamptz not null,
  draws_at timestamptz not null,
  ticket_start integer not null default 1 check (ticket_start > 0),
  ticket_end integer not null check (ticket_end >= ticket_start),
  yape_number text not null,
  yape_recipient text not null,
  yape_qr_url text,
  terms text not null default '',
  status raffle_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  document text not null,
  whatsapp text not null,
  email text,
  created_at timestamptz not null default now(),
  unique(document, whatsapp)
);

create table purchases (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id),
  participant_id uuid not null references participants(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents > 0),
  total_cents integer generated always as (quantity * unit_price_cents) stored,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null unique references purchases(id),
  status payment_status not null default 'PENDING',
  proof_path text not null,
  reviewed_by uuid references admins(user_id),
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id),
  participant_id uuid not null references participants(id),
  purchase_id uuid not null references purchases(id),
  payment_id uuid not null references payments(id),
  number integer not null,
  status ticket_status not null default 'ACTIVE',
  assigned_at timestamptz not null default now(),
  unique(raffle_id, number)
);

create table draw_extractions (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id),
  sequence integer not null,
  prize text not null,
  ticket_id uuid not null unique references tickets(id),
  eligible_count integer not null,
  eligible_hash text not null,
  executed_by uuid not null references admins(user_id),
  executed_at timestamptz not null default now(),
  voided_at timestamptz,
  void_reason text,
  unique(raffle_id, sequence)
);

create table audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references admins(user_id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index tickets_raffle_status_idx on tickets(raffle_id, status);
create index payments_status_idx on payments(status, created_at);
create index participants_search_idx on participants(document, whatsapp);

alter table admins enable row level security;
alter table raffles enable row level security;
alter table participants enable row level security;
alter table purchases enable row level security;
alter table payments enable row level security;
alter table tickets enable row level security;
alter table draw_extractions enable row level security;
alter table audit_logs enable row level security;

create policy "public reads active raffles" on raffles for select using (status in ('ACTIVE','SALES_CLOSED','DRAWING','FINISHED'));
create policy "public reads finished draws" on draw_extractions for select using (exists(select 1 from raffles r where r.id=raffle_id and r.status='FINISHED') and voided_at is null);

create or replace function is_admin() returns boolean language sql security definer set search_path=public stable as $$
  select exists(select 1 from admins where user_id=auth.uid() and active);
$$;

create or replace function approve_payment(p_payment uuid) returns setof tickets language plpgsql security definer set search_path=public as $$
declare v_payment payments; v_purchase purchases; v_raffle raffles; v_start integer;
begin
  if not is_admin() then raise exception 'not_authorized'; end if;
  select * into v_payment from payments where id=p_payment for update;
  if not found or v_payment.status <> 'PENDING' then raise exception 'payment_not_pending'; end if;
  select * into v_purchase from purchases where id=v_payment.purchase_id for update;
  select * into v_raffle from raffles where id=v_purchase.raffle_id for update;
  if v_raffle.status not in ('ACTIVE','PAUSED') then raise exception 'sales_not_open'; end if;
  select coalesce(max(number)+1,v_raffle.ticket_start) into v_start from tickets where raffle_id=v_raffle.id;
  if v_start+v_purchase.quantity-1 > v_raffle.ticket_end then raise exception 'insufficient_tickets'; end if;
  update payments set status='APPROVED',reviewed_by=auth.uid(),reviewed_at=now() where id=p_payment;
  insert into tickets(raffle_id,participant_id,purchase_id,payment_id,number,status)
    select v_purchase.raffle_id,v_purchase.participant_id,v_purchase.id,p_payment,n,'ACTIVE'
    from generate_series(v_start,v_start+v_purchase.quantity-1) n;
  insert into audit_logs(admin_id,action,entity_type,entity_id,metadata) values(auth.uid(),'PAYMENT_APPROVED','payment',p_payment::text,jsonb_build_object('quantity',v_purchase.quantity));
  return query select * from tickets where payment_id=p_payment order by number;
end $$;

create or replace function execute_draw(p_raffle uuid,p_prize text,p_request_key text) returns draw_extractions language plpgsql security definer set search_path=public as $$
declare v_raffle raffles; v_count integer; v_offset integer; v_ticket tickets; v_seq integer; v_hash text; v_result draw_extractions;
begin
  if not is_admin() then raise exception 'not_authorized'; end if;
  if length(trim(p_prize))<2 then raise exception 'invalid_prize'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_raffle::text,0));
  select * into v_raffle from raffles where id=p_raffle for update;
  if v_raffle.status not in ('SALES_CLOSED','DRAWING') then raise exception 'raffle_not_drawable'; end if;
  select count(*) into v_count from tickets where raffle_id=p_raffle and status='ACTIVE';
  if v_count=0 then raise exception 'no_active_tickets'; end if;
  select encode(digest(string_agg(id::text,',' order by id),'sha256'),'hex') into v_hash from tickets where raffle_id=p_raffle and status='ACTIVE';
  v_offset := floor(random()*v_count);
  select * into v_ticket from tickets where raffle_id=p_raffle and status='ACTIVE' order by id offset v_offset limit 1 for update;
  select coalesce(max(sequence),0)+1 into v_seq from draw_extractions where raffle_id=p_raffle;
  update tickets set status='WINNER' where id=v_ticket.id;
  update raffles set status='DRAWING',updated_at=now() where id=p_raffle;
  insert into draw_extractions(raffle_id,sequence,prize,ticket_id,eligible_count,eligible_hash,executed_by)
    values(p_raffle,v_seq,trim(p_prize),v_ticket.id,v_count,v_hash,auth.uid()) returning * into v_result;
  insert into audit_logs(admin_id,action,entity_type,entity_id,metadata) values(auth.uid(),'DRAW_EXECUTED','draw_extraction',v_result.id::text,jsonb_build_object('request_key',p_request_key,'ticket_id',v_ticket.id));
  return v_result;
end $$;

revoke all on function approve_payment(uuid) from public;
revoke all on function execute_draw(uuid,text,text) from public;
grant execute on function approve_payment(uuid) to authenticated;
grant execute on function execute_draw(uuid,text,text) to authenticated;
