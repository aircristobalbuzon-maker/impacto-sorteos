import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bgqdjlbfucavavdhanxm.supabase.co'
  try {
    const response = await fetch(`${url}/auth/v1/health`, { cache: 'no-store' })
    const text = await response.text()
    return NextResponse.json({ ok: response.ok, status: response.status, body: text.slice(0, 300) })
  } catch (error) {
    const err = error as Error & { cause?: unknown }
    return NextResponse.json({
      ok: false,
      error: err.message,
      cause: String(err.cause || ''),
      stack: err.stack?.split('\n').slice(0, 4),
    }, { status: 500 })
  }
}
