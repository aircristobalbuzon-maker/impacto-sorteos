import { requireAdmin } from '@/lib/supabase/server'
import { ticketNumber } from '@/lib/format'
import { ticketStatusLabel } from '@/lib/status-labels'

export default async function Page() {
  const { supabase: db } = await requireAdmin()
  const { data: rows } = await db.from('tickets').select('id,number,status,participants(full_name,document),raffles(name)').order('assigned_at', { ascending: false }).limit(1000)
  return <><span className="eyebrow">REGISTRO</span><h1>Tickets</h1><div className="card table-wrap"><table><thead><tr><th>Ticket</th><th>Participante</th><th>Sorteo</th><th>Estado</th></tr></thead><tbody>{rows?.map((ticket: any) => <tr key={ticket.id}><td>{ticketNumber(ticket.number)}</td><td>{ticket.participants.full_name}<br/><small>{ticket.participants.document}</small></td><td>{ticket.raffles.name}</td><td><span className="status">{ticketStatusLabel(ticket.status)}</span></td></tr>)}</tbody></table></div></>
}
