import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const db = await createClient()
  const { data: raffles } = await db
    .from('raffles')
    .select('slug,status,draws_at')
    .in('status', ['ACTIVE', 'SALES_CLOSED', 'DRAWING'])
    .order('draws_at')

  const active = raffles?.find(raffle => raffle.status === 'ACTIVE') || raffles?.[0]

  if (active?.slug) redirect(`/sorteo/${active.slug}`)
  redirect('/')
}
