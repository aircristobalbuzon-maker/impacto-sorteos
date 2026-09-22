'use client'
import { useState } from 'react'
import { ticketNumber } from '@/lib/format'
import { ticketStatusLabel } from '@/lib/status-labels'

type Ticket = { id: string; number: number; status: string; raffles?: { name?: string } }

export default function Page() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Ticket[]>([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  async function search(event: React.FormEvent) {
    event.preventDefault(); setBusy(true)
    const response = await fetch(`/api/public/tickets?q=${encodeURIComponent(query)}`)
    const output = await response.json(); setBusy(false)
    setRows(output.tickets || []); setMessage(output.message || '')
  }
  return <main className="page"><span className="eyebrow">ÁREA DEL PARTICIPANTE</span><h1>CONSULTAR MIS TICKETS</h1><div className="grid"><form className="card col6" onSubmit={search}><p>Ingresa el mismo DNI/documento o WhatsApp utilizado en tu compra.</p><label>DNI/documento o WhatsApp</label><input value={query} onChange={event => setQuery(event.target.value)} required/><button disabled={busy}>{busy ? 'CONSULTANDO...' : 'CONSULTAR'}</button></form><section className="card col6">{rows.map(ticket => <div key={ticket.id} className="ticket"><b>{ticketNumber(ticket.number)}</b><br/><small>{ticket.raffles?.name}</small><br/><span>{ticketStatusLabel(ticket.status)}</span></div>)}{!rows.length && <p className="muted">{message || 'Tus tickets aparecerán aquí después de que IMPACTO apruebe el pago.'}</p>}</section></div></main>
}
