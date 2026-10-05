'use client'

import { FormEvent, useState } from 'react'

export default function Page() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()
      setMessage(response.ok
        ? 'Te enviamos un enlace para crear una nueva contraseña. Revisa también tu carpeta de spam.'
        : (result.error || 'No pudimos enviar el enlace. Inténtalo nuevamente.'))
    } catch {
      setMessage('No pudimos enviar el enlace. Inténtalo nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="page">
    <span className="eyebrow">ACCESO ADMINISTRATIVO</span>
    <h1>RECUPERA TU ACCESO</h1>
    <section className="card" style={{maxWidth:520}}>
      <p className="muted">Escribe el correo de administrador. Recibirás un enlace para crear una nueva contraseña.</p>
      <form onSubmit={submit}>
        <label htmlFor="email">Correo de administrador</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required/>
        <button style={{width:'100%',marginTop:18}} disabled={busy}>{busy ? 'ENVIANDO…' : 'ENVIAR ENLACE DE RECUPERACIÓN'}</button>
      </form>
      {message && <p role="status" style={{marginTop:18}}>{message}</p>}
      <a className="forgot-link" href="/acceso-admin">Volver al inicio de sesión</a>
    </section>
  </main>
}
