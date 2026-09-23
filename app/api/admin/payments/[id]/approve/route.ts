import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { sendTicketNotification } from '@/lib/whatsapp'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { supabase, user } = await requireAdmin()
    const { data: tickets, error } = await supabase.rpc('approve_payment', { p_payment: id })
    if (error) throw error

    const db = adminClient()
    const { data: payment, error: paymentError } = await db
      .from('payments')
      .select('purchases(participants(full_name,whatsapp),raffles(name))')
      .eq('id', id)
      .single()
    let notification: Awaited<ReturnType<typeof sendTicketNotification>>
    if (paymentError || !payment) {
      notification = { status: 'failed', error: 'No se encontraron los datos del participante.' }
    } else {
      const purchase = payment.purchases as unknown as {
        participants: { full_name: string; whatsapp: string }
        raffles: { name: string }
      }
      notification = await sendTicketNotification({
        fullName: purchase.participants.full_name,
        whatsapp: purchase.participants.whatsapp,
        raffleName: purchase.raffles.name,
        ticketNumbers: (tickets || []).map((ticket: { number: number }) => ticket.number),
      })
    }

    await db.from('audit_logs').insert({
      admin_id: user.id,
      action: notification.status === 'sent' ? 'WHATSAPP_TICKETS_SENT' : 'WHATSAPP_TICKETS_FAILED',
      entity_type: 'payment',
      entity_id: id,
      metadata: notification,
    })

    const redirect = new URL('/admin/pagos', request.url)
    redirect.searchParams.set('whatsapp', notification.status)
    return NextResponse.redirect(redirect, 303)
  } catch (error) {
    console.error('[payment approval] failed', error)
    return NextResponse.json({ error: 'No se pudo aprobar el pago.' }, { status: 400 })
  }
}
