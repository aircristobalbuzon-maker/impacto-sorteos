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
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch(`/api/public/tickets?q=${encodeURIComponent(query)}`)
      const output = await response.json()
      setRows(output.tickets || [])
      setMessage(output.message || '')
    } catch {
      setRows([])
      setMessage('No pudimos realizar la consulta. Inténtalo nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="page ticket-lookup-page">
    <span className="eyebrow">ÁREA DEL PARTICIPANTE</span>
    <h1>Consulta todos tus tickets</h1>
    <p className="lead">Usa tu DNI o documento. Así encontrarás juntos todos tus tickets aprobados, aunque hayas comprado más de una vez o utilizado otro número de celular.</p>
    <div className="lookup-layout">
      <form className="card lookup-form" onSubmit={search}>
        <label htmlFor="ticket-query">DNI o documento</label>
        <input id="ticket-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ingresa tu DNI" inputMode="numeric" autoComplete="off" required />
        <button disabled={busy}>{busy ? 'BUSCANDO TICKETS...' : 'CONSULTAR MIS TICKETS'}</button>
        <small>También puedes ingresar el WhatsApp utilizado en tu compra.</small>
      </form>
      <section className="card ticket-results" aria-live="polite">
        {rows.length > 0 && <div className="ticket-summary"><strong>{rows.length}</strong><span>ticket{rows.length === 1 ? '' : 's'} encontrado{rows.length === 1 ? '' : 's'}</span></div>}
        <div className="ticket-list">{rows.map(ticket => <article key={ticket.id} className="ticket"><small>{ticket.raffles?.name}</small><b>{ticketNumber(ticket.number)}</b><span>{ticketStatusLabel(ticket.status)}</span></article>)}</div>
        {!rows.length && <p className="muted">{message || 'Tus tickets aparecerán aquí después de que IMPACTO apruebe el pago.'}</p>}
        {rows.length > 0 && message && <p className="success-text">{message}</p>}
      </section>
    </div>
  </main>
}
