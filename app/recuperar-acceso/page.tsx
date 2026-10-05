'use client'

import { FormEvent, useState } from 'react'

export default function Page() {
  const [email, setEmail] = useState('aircristobalbuzon@gmail.com')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) return setMessage('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) return setMessage('Las contraseñas no coinciden.')
    setBusy(true)
    setMessage('')
    setOk(false)
    try {
      const response = await fetch('/api/auth/recover-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      })
      const result = await response.json()
      setOk(response.ok)
      setMessage(response.ok ? 'Contraseña actualizada. Ya puedes entrar al panel.' : (result.error || 'No pudimos actualizar la contraseña.'))
    } catch {
      setMessage('No pudimos actualizar la contraseña. Inténtalo nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  return <main className="page">
    <span className="eyebrow">ACCESO ADMINISTRATIVO</span>
    <h1>RECUPERA TU ACCESO</h1>
    <section className="card" style={{maxWidth:520}}>
      <p className="muted">Usa el código temporal de recuperación y crea una contraseña nueva.</p>
      <form onSubmit={submit}>
        <label htmlFor="email">Correo de administrador</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required/>
        <label htmlFor="code">Código temporal</label>
        <input id="code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} autoComplete="one-time-code" required/>
        <label htmlFor="password">Nueva contraseña</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required/>
        <label htmlFor="confirm">Repite la nueva contraseña</label>
        <input id="confirm" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={8} required/>
        <button style={{width:'100%',marginTop:18}} disabled={busy}>{busy ? 'ACTUALIZANDO…' : 'CAMBIAR CONTRASEÑA'}</button>
      </form>
      {message && <p role="status" className={ok ? 'success-text' : ''} style={{marginTop:18}}>{message}</p>}
      {ok && <a className="primary" style={{width:'100%',marginTop:12}} href="/acceso-admin">ENTRAR AL PANEL</a>}
      <a className="forgot-link" href="/acceso-admin">Volver al inicio de sesión</a>
    </section>
  </main>
}
