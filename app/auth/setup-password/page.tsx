'use client'

import { FormEvent, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bgqdjlbfucavavdhanxm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncWRqbGJmdWNhdmF2ZGhhbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzc4MzksImV4cCI6MjEwNTY1MzgzOX0.T5KklEUHS2RWq8U8Qw7E5B3aBUenTb6pG8zU-WiakYw'

export default function SetupPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(supabaseUrl, supabaseAnonKey), [])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password.length < 8) return setMessage('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) return setMessage('Las contraseñas no coinciden.')
    setSaving(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      setMessage('El enlace venció o no es válido. Solicita una nueva invitación.')
      return
    }
    router.replace('/acceso-admin?password=created')
  }

  return <main className="page">
    <span className="eyebrow">ACCESO ADMINISTRATIVO</span>
    <h1>CREA TU CONTRASEÑA</h1>
    <section className="card" style={{maxWidth:520}}>
      <p className="muted">Esta contraseña te permitirá administrar los sorteos de IMPACTO.</p>
      <form onSubmit={submit} style={{display:'grid',gap:16}}>
        <label>Nueva contraseña<input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8}/></label>
        <label>Repite la contraseña<input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8}/></label>
        {message && <p>{message}</p>}
        <button className="primary" type="submit" disabled={saving}>{saving?'GUARDANDO…':'CREAR CONTRASEÑA'}</button>
      </form>
    </section>
  </main>
}
