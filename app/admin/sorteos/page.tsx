import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/server'
import { raffleStatusLabel } from '@/lib/status-labels'

async function createRaffle(form: FormData) {
  'use server'
  const { supabase } = await requireAdmin()
  const name = String(form.get('name'))
  const slug = String(form.get('slug')).toLowerCase().replace(/[^a-z0-9-]/g, '-')
  const { error } = await supabase.from('raffles').insert({
    name,
    slug,
    description: String(form.get('description')),
    price_cents: Math.round(Number(form.get('price')) * 100),
    starts_at: String(form.get('startsAt')),
    draws_at: String(form.get('drawsAt')),
    ticket_start: Number(form.get('ticketStart')),
    ticket_end: Number(form.get('ticketEnd')),
    yape_number: String(form.get('yapeNumber')),
    yape_recipient: String(form.get('yapeRecipient')),
    terms: String(form.get('terms')),
    status: 'DRAFT',
  })
  if (error) throw error
  redirect('/admin/sorteos')
}

export default async function Page() {
  const { supabase: db } = await requireAdmin()
  const { data: rows } = await db.from('raffles').select('*').order('created_at', { ascending: false })
  return <>
    <span className="eyebrow">CONFIGURACIÓN</span>
    <h1>Sorteos</h1>
    <p className="muted">Crea el sorteo, revisa sus datos y luego pulsa <b>ACTIVAR Y PUBLICAR</b> desde “Gestionar”.</p>
    <div className="grid">
      <section className="card col8 table-wrap">
        <table>
          <thead><tr><th>Nombre</th><th>Estado</th><th>Publicación</th><th>Acción</th></tr></thead>
          <tbody>{rows?.map(raffle => <tr key={raffle.id}>
            <td><b>{raffle.name}</b><br/><small>S/ {(raffle.price_cents / 100).toFixed(2)} por ticket</small></td>
            <td><span className={`status status-${raffle.status.toLowerCase()}`}>{raffleStatusLabel(raffle.status)}</span></td>
            <td>{raffle.status === 'ACTIVE' ? <Link href={`/sorteo/${raffle.slug}`} target="_blank">Ver publicado ↗</Link> : <span className="muted">No visible</span>}</td>
            <td><Link className="outline" href={`/admin/sorteos/${raffle.id}`}>GESTIONAR</Link></td>
          </tr>)}</tbody>
        </table>
      </section>
      <form className="card col4" action={createRaffle}>
        <h2>+ Crear sorteo</h2>
        <p className="muted">Se guardará primero como borrador para que puedas revisarlo.</p>
        <label>Nombre</label><input name="name" required/>
        <label>Enlace corto</label><input name="slug" placeholder="ej. experiencia-impacto" required/>
        <label>Descripción</label><textarea name="description" required/>
        <label>Precio por ticket (S/)</label><input name="price" type="number" min="0.01" step="0.01" required/>
        <label>Inicio de ventas</label><input name="startsAt" type="datetime-local" required/>
        <label>Fecha del sorteo</label><input name="drawsAt" type="datetime-local" required/>
        <label>Numeración inicial</label><input name="ticketStart" type="number" defaultValue="1" min="1" required/>
        <label>Numeración final</label><input name="ticketEnd" type="number" defaultValue="1000" min="1" required/>
        <label>Número de Yape</label><input name="yapeNumber" required/>
        <label>Titular de Yape</label><input name="yapeRecipient" required/>
        <label>Bases y condiciones</label><textarea name="terms" required/>
        <button>GUARDAR COMO BORRADOR</button>
      </form>
    </div>
  </>
}
