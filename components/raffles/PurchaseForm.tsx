'use client'

import { useState } from 'react'
import { money } from '@/lib/format'

export default function PurchaseForm({ slug, price }: { slug: string; price: number }) {
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    const form = new FormData(event.currentTarget)
    form.set('quantity', String(quantity))

    try {
      const response = await fetch(`/api/public/raffles/${slug}/purchase`, {
        method: 'POST',
        body: form,
      })
      const result = await response.json()
      setMessage(
        response.ok
          ? `Participación registrada. Código: ${result.purchaseId}. Validaremos tu Yape antes de activar tus tickets.`
          : result.error || 'No se pudo registrar la participación.',
      )
    } catch {
      setMessage('No se pudo conectar. Revisa tu conexión e inténtalo nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset>
        <legend>Elige cuántos tickets quieres</legend>
        <div className="steps">
          {[1, 3, 5, 10].map((number) => (
            <button
              type="button"
              key={number}
              className={quantity === number ? '' : 'outline'}
              onClick={() => setQuantity(number)}
              aria-pressed={quantity === number}
            >
              {number} TICKET{number > 1 ? 'S' : ''}
            </button>
          ))}
        </div>
      </fieldset>

      <label htmlFor="quantity">Cantidad personalizada</label>
      <input id="quantity" name="quantity" type="number" min="1" max="100" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required />

      <h3>Total: {money(quantity * price)}</h3>

      <label htmlFor="fullName">Nombre y apellidos</label>
      <input id="fullName" name="fullName" autoComplete="name" required />

      <label htmlFor="document">DNI o documento</label>
      <input id="document" name="document" autoComplete="off" required />

      <label htmlFor="whatsapp">WhatsApp</label>
      <input id="whatsapp" name="whatsapp" type="tel" autoComplete="tel" required />

      <label htmlFor="email">Correo (opcional)</label>
      <input id="email" name="email" type="email" autoComplete="email" />

      <label htmlFor="proof">Comprobante de Yape</label>
      <input id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp" required />

      <button disabled={busy}>{busy ? 'ENVIANDO...' : 'ENVIAR COMPROBANTE'}</button>
      {message && <p className="status" role="status" aria-live="polite">{message}</p>}
    </form>
  )
}
