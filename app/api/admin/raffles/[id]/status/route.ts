import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/server'

const transitions: Record<string, string[]> = {
  DRAFT: ['ACTIVE'],
  ACTIVE: ['PAUSED', 'SALES_CLOSED'],
  PAUSED: ['ACTIVE'],
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const form = await req.formData()
    const nextStatus = String(form.get('status') || '')
    const { supabase, user } = await requireAdmin()
    const { data: raffle, error: readError } = await supabase.from('raffles').select('status').eq('id', id).single()
    if (readError || !raffle) throw new Error('Sorteo no encontrado')
    if (!transitions[raffle.status]?.includes(nextStatus)) throw new Error('Cambio de estado no permitido')

    if (nextStatus === 'ACTIVE') {
      await supabase.from('raffles').update({ status: 'PAUSED', updated_at: new Date().toISOString() }).eq('status', 'ACTIVE').neq('id', id)
    }
    const { error } = await supabase.from('raffles').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action: `RAFFLE_${nextStatus}`,
      entity_type: 'raffle',
      entity_id: id,
      metadata: { previous_status: raffle.status },
    })
    return NextResponse.redirect(new URL(`/admin/sorteos/${id}?saved=status`, req.url), 303)
  } catch (error) {
    console.error('[admin/raffles/status] failed', { error: String(error) })
    return NextResponse.json({ error: 'No se pudo cambiar el estado del sorteo.' }, { status: 400 })
  }
}
