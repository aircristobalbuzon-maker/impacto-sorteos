import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const form = await req.formData()
  const email = String(form.get('email') || '').trim().toLowerCase()
  const password = String(form.get('password') || '')
  const db = await createClient()
  const { error } = await db.auth.signInWithPassword({ email, password })

  if (error) {
    console.warn('[auth/login] Supabase rejected sign-in', {
      code: error.code,
      status: error.status,
    })
    return NextResponse.redirect(new URL('/acceso-admin?error=credentials', req.url), 303)
  }

  return NextResponse.redirect(new URL('/admin', req.url), 303)
}
