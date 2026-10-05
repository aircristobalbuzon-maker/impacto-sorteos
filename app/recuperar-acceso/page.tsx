'use client'

import { FormEvent, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export default function Page() {
  const supabase = useMemo(() => createClient(supabaseUrl, supabaseAnonKey), [])
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const redirectTo = `${window.location.origin}/auth/setup-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo })
    setBusy(false)
    setMessage(error
      ? 'No pudimos enviar el enlace. Revisa el correo e inténtalo nuevamente.'
      : 'Te enviamos un enlace para crear una nueva contraseña. Revisa también tu carpeta de spam.')
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