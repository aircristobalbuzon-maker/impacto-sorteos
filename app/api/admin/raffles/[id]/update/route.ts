import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/server'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const form = await req.formData()
    const { supabase, user } = await requireAdmin()
    const { data: raffle } = await supabase.from('raffles').select('status').eq('id', id).single()
    if (!raffle || !['DRAFT', 'ACTIVE', 'PAUSED'].includes(raffle.status)) throw new Error('Este sorteo ya no puede editarse')

    const ticketStart = Number(form.get('ticketStart'))
    const ticketEnd = Number(form.get('ticketEnd'))
    if (ticketEnd < ticketStart) throw new Error('Numeración inválida')
    const { error } = await supabase.from('raffles').update({
      name: String(form.get('name')).trim(),
      description: String(form.get('description')).trim(),
      price_cents: Math.round(Number(form.get('price')) * 100),
      starts_at: String(form.get('startsAt')),
      draws_at: String(form.get('drawsAt')),
      ticket_start: ticketStart,
      ticket_end: ticketEnd,
      yape_number: String(form.get('yapeNumber')).trim(),
      yape_recipient: String(form.get('yapeRecipient')).trim(),
      terms: String(form.get('terms')).trim(),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) throw error
    await supabase.from('audit_logs').insert({ admin_id: user.id, action: 'RAFFLE_UPDATED', entity_type: 'raffle', entity_id: id })
    return NextResponse.redirect(new URL(`/admin/sorteos/${id}?saved=details`, req.url), 303)
  } catch (error) {
    console.error('[admin/raffles/update] failed', { error: String(error) })
    return NextResponse.json({ error: 'No se pudieron guardar los cambios.' }, { status: 400 })
  }
}
