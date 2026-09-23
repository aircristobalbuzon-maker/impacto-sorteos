import { NextResponse } from 'next/server'
import { z } from 'zod'
import { adminClient } from '@/lib/supabase/admin'
import { normalizeDocument, normalizeWhatsapp } from '@/lib/identity'

const Input = z.object({
  fullName: z.string().trim().min(3).max(120),
  document: z.string().min(5).max(30).transform(normalizeDocument),
  whatsapp: z.string().min(7).max(25).transform(normalizeWhatsapp),
  email: z.string().email().optional().or(z.literal('')),
  quantity: z.coerce.number().int().min(1).max(100),
})

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const form = await request.formData()
    const parsed = Input.parse(Object.fromEntries(form))
    const proof = form.get('proof')
    if (!(proof instanceof File) || proof.size > 8_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(proof.type)) {
      return NextResponse.json({ error: 'Adjunta una captura de Yape en JPG, PNG o WEBP (máximo 8 MB).' }, { status: 400 })
    }

    const db = adminClient()
    const { data: raffle } = await db.from('raffles').select('*').eq('slug', slug).eq('status', 'ACTIVE').single()
    if (!raffle) return NextResponse.json({ error: 'El sorteo no acepta participaciones.' }, { status: 409 })

    const { data: existingParticipants } = await db.from('participants').select('*').eq('document', parsed.document).order('created_at')
    let participant = existingParticipants?.find(row => row.whatsapp === parsed.whatsapp) || existingParticipants?.[0]
    if (participant) {
      const updated = await db.from('participants').update({
        full_name: parsed.fullName,
        whatsapp: parsed.whatsapp,
        email: parsed.email || participant.email,
      }).eq('id', participant.id).select().single()
      if (updated.error) throw updated.error
      participant = updated.data
    } else {
      const inserted = await db.from('participants').insert({
        full_name: parsed.fullName,
        document: parsed.document,
        whatsapp: parsed.whatsapp,
        email: parsed.email || null,
      }).select().single()
      if (inserted.error) throw inserted.error
      participant = inserted.data
    }

    const purchase = await db.from('purchases').insert({
      raffle_id: raffle.id,
      participant_id: participant.id,
      quantity: parsed.quantity,
      unit_price_cents: raffle.price_cents,
    }).select().single()
    if (purchase.error) throw purchase.error

    const extension = proof.type.split('/')[1]
    const path = `${raffle.id}/${purchase.data.id}.${extension}`
    const upload = await db.storage.from('payment-proofs').upload(path, proof, { contentType: proof.type, upsert: false })
    if (upload.error) {
      await db.from('purchases').delete().eq('id', purchase.data.id)
      throw upload.error
    }

    const payment = await db.from('payments').insert({ purchase_id: purchase.data.id, proof_path: path }).select().single()
    if (payment.error) throw payment.error
    return NextResponse.json({ purchaseId: purchase.data.id, status: 'PENDING' })
  } catch (error: unknown) {
    console.error('[purchase] registration failed', error)
    const issue = error instanceof z.ZodError ? error.issues[0]?.message : null
    return NextResponse.json({ error: issue || 'No se pudo registrar la participación.' }, { status: 400 })
  }
}
