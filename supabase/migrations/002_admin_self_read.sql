drop policy if exists "admins read own profile" on public.admins;
create policy "admins read own profile"
on public.admins
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admin manages raffles" on public.raffles;
create policy "admin manages raffles" on public.raffles for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages participants" on public.participants;
create policy "admin manages participants" on public.participants for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages purchases" on public.purchases;
create policy "admin manages purchases" on public.purchases for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages payments" on public.payments;
create policy "admin manages payments" on public.payments for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages tickets" on public.tickets;
create policy "admin manages tickets" on public.tickets for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages draw extractions" on public.draw_extractions;
create policy "admin manages draw extractions" on public.draw_extractions for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin manages audit logs" on public.audit_logs;
create policy "admin manages audit logs" on public.audit_logs for all to authenticated
using (public.is_admin()) with check (public.is_admin());
