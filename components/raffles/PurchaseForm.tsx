'use client'

import { useState } from 'react'
import Link from 'next/link'
import { money } from '@/lib/format'

type Props = {
  slug: string
  raffleName: string
  price: number
  yapeNumber: string
  yapeRecipient: string
}

export default function PurchaseForm({ slug, raffleName, price, yapeNumber, yapeRecipient }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)
  const [proofName, setProofName] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const form = new FormData(event.currentTarget)
      form.set('quantity', String(quantity))
      const response = await fetch(`/api/public/raffles/${slug}/purchase`, { method: 'POST', body: form })
      const result = await response.json()
      setSuccess(response.ok)
      setMessage(response.ok
        ? `Tu comprobante fue enviado correctamente. Código de registro: ${result.purchaseId}.`
        : result.error || 'No se pudo registrar la participación.')
    } catch {
      setMessage('No se pudo conectar. Revisa tu conexión e inténtalo nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  if (success) {
    return <section className="purchase-success" role="status">
      <span className="success-icon">✓</span>
      <h2>¡Comprobante recibido!</h2>
      <p>{message}</p>
      <p>IMPACTO revisará el pago. Cuando sea aprobado, tus tickets aparecerán en la consulta y recibirás la confirmación por WhatsApp.</p>
      <Link className="outline" href="/mis-tickets">CONSULTAR MIS TICKETS</Link>
    </section>
  }

  return <form className="purchase-form" onSubmit={submit}>
    <div className="form-step">
      <div className="step-title"><b>1</b><div><span>REGISTRO</span><h2>Completa tus datos</h2></div></div>
      <p className="step-help">Usaremos tu DNI para reunir todas tus compras, aunque después utilices otro celular.</p>
      <div className="form-grid">
        <div className="field-wide"><label htmlFor="fullName">Nombre y apellidos</label><input id="fullName" name="fullName" autoComplete="name" placeholder="Tal como aparece en tu documento" required /></div>
        <div><label htmlFor="document">DNI o documento</label><input id="document" name="document" inputMode="numeric" autoComplete="off" placeholder="Ejemplo: 12345678" required /></div>
        <div><label htmlFor="whatsapp">WhatsApp</label><input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ejemplo: 999 999 999" required /></div>
        <div className="field-wide"><label htmlFor="email">Correo (opcional)</label><input id="email" name="email" type="email" autoComplete="email" placeholder="tucorreo@ejemplo.com" /></div>
      </div>
    </div>

    <div className="form-step">
      <div className="step-title"><b>2</b><div><span>TICKETS</span><h2>Elige tu cantidad</h2></div></div>
      <div className="ticket-options" role="group" aria-label="Cantidad de tickets">
        {[1, 3, 5, 10].map(number => <button type="button" key={number} className={quantity === number ? 'selected' : 'outline'} onClick={() => setQuantity(number)} aria-pressed={quantity === number}>{number}<small>{number === 1 ? 'ticket' : 'tickets'}</small></button>)}
      </div>
      <label htmlFor="quantity">Otra cantidad</label>
      <input id="quantity" name="quantity" type="number" min="1" max="100" value={quantity} onChange={event => setQuantity(Number(event.target.value))} required />
      <div className="purchase-total"><span>Total a pagar</span><strong>{money(quantity * price)}</strong><small>{quantity} ticket{quantity === 1 ? '' : 's'} para {raffleName}</small></div>
    </div>

    <div className="form-step yape-step">
      <div className="step-title"><b>3</b><div><span>PAGO</span><h2>Realiza el Yape</h2></div></div>
      <p className="step-help">Yapea exactamente el total indicado y toma una captura cuando el pago aparezca como exitoso.</p>
      <div className="yape-box">
        <span>YAPEAR A NOMBRE DE</span>
        <strong>{yapeRecipient}</strong>
        <a href={`tel:${yapeNumber}`} aria-label={`Número de Yape ${yapeNumber}`}>{yapeNumber}</a>
        <div><small>MONTO EXACTO</small><b>{money(quantity * price)}</b></div>
      </div>
    </div>

    <div className="form-step proof-step">
      <div className="step-title"><b>4</b><div><span>COMPROBANTE</span><h2>Sube la captura del Yape</h2></div></div>
      <p className="step-help">Este paso es obligatorio. Selecciona la captura donde se vea que el pago fue realizado.</p>
      <label className={`upload-box ${proofName ? 'has-file' : ''}`} htmlFor="proof">
        <span className="upload-icon">{proofName ? '✓' : '↑'}</span>
        <strong>{proofName ? 'Captura seleccionada' : 'TOCA AQUÍ PARA SUBIR LA CAPTURA'}</strong>
        <small>{proofName || 'JPG, PNG o WEBP · máximo 8 MB'}</small>
      </label>
      <input className="file-input" id="proof" name="proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setProofName(event.target.files?.[0]?.name || '')} required />
    </div>

    <button className="submit-purchase" disabled={busy}>{busy ? 'ENVIANDO COMPROBANTE...' : 'ENVIAR COMPROBANTE Y PARTICIPAR'}</button>
    <p className="privacy-note">Al enviar, tu participación quedará pendiente hasta que IMPACTO valide el comprobante.</p>
    {message && <p className="form-message error" role="alert">{message}</p>}
  </form>
}
