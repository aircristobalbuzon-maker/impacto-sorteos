import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { normalizeDocument, normalizeWhatsapp } from '@/lib/identity'

export async function GET(request: Request) {
  const rawQuery = new URL(request.url).searchParams.get('q')?.trim() || ''
  if (rawQuery.length < 5) {
    return NextResponse.json({ message: 'Ingresa un DNI, documento o WhatsApp válido.', tickets: [] }, { status: 400 })
  }

  const db = adminClient()
  const document = normalizeDocument(rawQuery)
  const whatsapp = normalizeWhatsapp(rawQuery)
  const [{ data: documentMatches, error: documentError }, { data: phoneMatches, error: phoneError }] = await Promise.all([
    db.from('participants').select('id').eq('document', document),
    db.from('participants').select('id').eq('whatsapp', whatsapp),
  ])

  if (documentError || phoneError) {
    console.error('[tickets] participant lookup failed', { documentError, phoneError })
    return NextResponse.json({ message: 'No pudimos consultar los tickets. Inténtalo nuevamente.', tickets: [] }, { status: 500 })
  }

  const participantIds = [...new Set([...(documentMatches || []), ...(phoneMatches || [])].map(row => row.id))]
  if (!participantIds.length) {
    return NextResponse.json({ message: 'No encontramos participaciones con ese dato.', tickets: [] })
  }

  const { data: tickets, error: ticketsError } = await db
    .from('tickets')
    .select('id,number,status,assigned_at,raffles(name,slug)')
    .in('participant_id', participantIds)
    .order('assigned_at', { ascending: false })

  if (ticketsError) {
    console.error('[tickets] ticket lookup failed', { ticketsError })
    return NextResponse.json({ message: 'No pudimos consultar los tickets. Inténtalo nuevamente.', tickets: [] }, { status: 500 })
  }

  const count = tickets?.length || 0
  return NextResponse.json({
    tickets: tickets || [],
    message: count ? `Encontramos ${count} ticket${count === 1 ? '' : 's'} asociados a tu documento.` : 'Tus pagos todavía no han sido aprobados.',
  })
}
