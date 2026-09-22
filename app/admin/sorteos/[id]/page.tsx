import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/server'
import { raffleStatusLabel } from '@/lib/status-labels'
import DrawConsole from '@/components/admin/DrawConsole'

function dateInput(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params
  const query = await searchParams
  const { supabase: db } = await requireAdmin()
  const [{ data: raffle }, { count }, { data: draws }] = await Promise.all([
    db.from('raffles').select('*').eq('id', id).single(),
    db.from('tickets').select('*', { count: 'exact', head: true }).eq('raffle_id', id).eq('status', 'ACTIVE'),
    db.from('draw_extractions').select('id,sequence,prize,tickets(number,participants(full_name))').eq('raffle_id', id).is('voided_at', null).order('sequence'),
  ])
  if (!raffle) notFound()
  const editable = ['DRAFT', 'ACTIVE', 'PAUSED'].includes(raffle.status)

  return <>
    <span className="eyebrow">{raffleStatusLabel(raffle.status)}</span>
    <h1>{raffle.name}</h1>
    {query.saved && <p className="success" role="status">Cambios guardados correctamente.</p>}
    <div className="grid">
      <section className="card col4">
        <h3>Estado de publicación</h3>
        <p><span className={`status status-${raffle.status.toLowerCase()}`}>{raffleStatusLabel(raffle.status)}</span></p>
        {raffle.status === 'DRAFT' && <p className="muted">Este borrador todavía no aparece en la página pública.</p>}
        {raffle.status === 'ACTIVE' && <p className="muted">El público puede verlo y registrar compras.</p>}
        {raffle.status === 'PAUSED' && <p className="muted">Está oculto temporalmente y no acepta compras.</p>}
        <div className="actions vertical-actions">
          {['DRAFT', 'PAUSED'].includes(raffle.status) && <form action={`/api/admin/raffles/${id}/status`} method="post"><input type="hidden" name="status" value="ACTIVE"/><button>ACTIVAR Y PUBLICAR</button></form>}
          {raffle.status === 'ACTIVE' && <>
            <Link className="outline" href={`/sorteo/${raffle.slug}`} target="_blank">VER PÁGINA PÚBLICA ↗</Link>
            <form action={`/api/admin/raffles/${id}/status`} method="post"><input type="hidden" name="status" value="PAUSED"/><button className="outline">PAUSAR PUBLICACIÓN</button></form>
            <form action={`/api/admin/raffles/${id}/status`} method="post"><input type="hidden" name="status" value="SALES_CLOSED"/><button>CERRAR VENTAS</button></form>
          </>}
        </div>
      </section>
      <section className="card col4">
        <span>Tickets participando</span><div className="metric">{count || 0}</div>
        <Link className="outline" href={`/live/${raffle.slug}`} target="_blank">ABRIR MODO TRANSMISIÓN</Link>
      </section>
      <section className="card col4">
        <h3>Siguiente paso</h3>
        <p className="muted">{raffle.status === 'DRAFT' ? 'Revisa la información y activa el sorteo.' : raffle.status === 'ACTIVE' ? 'Valida los pagos para asignar tickets.' : raffle.status === 'PAUSED' ? 'Puedes editarlo y volver a publicarlo.' : 'Continúa con el control del sorteo.'}</p>
        <Link className="outline" href="/admin/pagos">IR A PAGOS</Link>
      </section>

      {editable && <form className="card col8" action={`/api/admin/raffles/${id}/update`} method="post">
        <h2>Editar información</h2>
        <label>Nombre</label><input name="name" defaultValue={raffle.name} required/>
        <label>Descripción</label><textarea name="description" defaultValue={raffle.description} required/>
        <label>Precio por ticket (S/)</label><input name="price" type="number" min="0.01" step="0.01" defaultValue={(raffle.price_cents / 100).toFixed(2)} required/>
        <div className="form-grid">
          <div><label>Inicio de ventas</label><input name="startsAt" type="datetime-local" defaultValue={dateInput(raffle.starts_at)} required/></div>
          <div><label>Fecha del sorteo</label><input name="drawsAt" type="datetime-local" defaultValue={dateInput(raffle.draws_at)} required/></div>
          <div><label>Ticket inicial</label><input name="ticketStart" type="number" min="1" defaultValue={raffle.ticket_start} required/></div>
          <div><label>Ticket final</label><input name="ticketEnd" type="number" min="1" defaultValue={raffle.ticket_end} required/></div>
        </div>
        <label>Número de Yape</label><input name="yapeNumber" defaultValue={raffle.yape_number} required/>
        <label>Titular de Yape</label><input name="yapeRecipient" defaultValue={raffle.yape_recipient} required/>
        <label>Bases y condiciones</label><textarea name="terms" defaultValue={raffle.terms} required/>
        <button>GUARDAR CAMBIOS</button>
      </form>}

      <section className="card col4">
        <h3>Extracciones realizadas</h3>
        {!draws?.length && <p className="muted">Todavía no hay ganadores.</p>}
        {draws?.map((draw: any) => <p key={draw.id}>#{draw.sequence} · Ticket #{draw.tickets.number}<br/><b>{draw.prize}</b><br/><small>{draw.tickets.participants.full_name}</small></p>)}
      </section>
      <div className="col8">{['SALES_CLOSED', 'DRAWING'].includes(raffle.status) && <DrawConsole id={id}/>}</div>
      {['SALES_CLOSED', 'DRAWING'].includes(raffle.status) && <section className="card col4"><h3>Finalizar</h3><p className="muted">Hazlo cuando hayas completado todas las extracciones.</p><form action={`/api/admin/raffles/${id}/finish`} method="post"><button className="outline">FINALIZAR SORTEO</button></form></section>}
    </div>
  </>
}
