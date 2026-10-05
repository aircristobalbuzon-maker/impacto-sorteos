import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const form = await req.formData()
    const { supabase, user } = await requireAdmin()
    const { data: raffle } = await supabase.from('raffles').select('status').eq('id', id).single()
    if (!raffle || !['DRAFT', 'ACTIVE', 'PAUSED'].includes(raffle.status)) throw new Error('Este sorteo ya no puede editarse')

    const ticketStart = Number(form.get('ticketStart'))
    const service = adminClient()
    const bucket = 'raffle-assets'
    await service.storage.createBucket(bucket, { public: true }).catch(() => null)

    async function uploadAsset(field: string, prefix: string) {
      const file = form.get(field)
      if (!(file instanceof File) || file.size === 0) return undefined
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
        throw new Error('Imagen inválida. Usa JPG, PNG o WEBP de máximo 8 MB.')
      }
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${id}/${prefix}-${Date.now()}.${extension}`
      const bytes = new Uint8Array(await file.arrayBuffer())
      const { error: uploadError } = await service.storage.from(bucket).upload(path, bytes, { contentType: file.type, upsert: true })
      if (uploadError) throw uploadError
      return service.storage.from(bucket).getPublicUrl(path).data.publicUrl
    }

    const [yapeQrUrl, bannerUrl] = await Promise.all([
      uploadAsset('yapeQr', 'yape-qr'),
      uploadAsset('banner', 'banner'),
    ])
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
      ...(yapeQrUrl ? { yape_qr_url: yapeQrUrl } : {}),
      ...(bannerUrl ? { banner_url: bannerUrl } : {}),
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
