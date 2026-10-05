import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) return NextResponse.json({ error: 'Ingresa tu correo de administrador.' }, { status: 400 })

    const allowedAdmin = String(process.env.PRIMARY_ADMIN_EMAIL || 'aircristobalbuzon@gmail.com').trim().toLowerCase()
    if (allowedAdmin && normalizedEmail !== allowedAdmin) {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()
    const origin = new URL(request.url).origin
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${origin}/auth/setup-password`,
    })
    if (error) {
      console.error('Password recovery error:', error.message)
      return NextResponse.json({ error: 'No pudimos enviar el enlace de recuperación.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Password recovery route error:', error)
    return NextResponse.json({ error: 'No pudimos procesar la recuperación.' }, { status: 500 })
  }
}
