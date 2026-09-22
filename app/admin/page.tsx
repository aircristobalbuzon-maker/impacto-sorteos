import Link from 'next/link'
import { money } from '@/lib/format'
import { requireAdmin } from '@/lib/supabase/server'
import { raffleStatusLabel } from '@/lib/status-labels'

export default async function Page() {
  const { supabase: db } = await requireAdmin()
  const [{ count: pending }, { count: participants }, { data: active }] = await Promise.all([
    db.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
    db.from('participants').select('*', { count: 'exact', head: true }),
    db.from('raffles').select('id,name,status,slug').in('status', ['ACTIVE', 'SALES_CLOSED', 'DRAWING']).limit(1).maybeSingle(),
  ])
  let revenue = 0
  if (active) {
    const { data: payments } = await db.from('payments').select('purchases(total_cents)').eq('status', 'APPROVED')
    revenue = (payments || []).reduce((sum: number, item: any) => sum + (item.purchases?.total_cents || 0), 0)
  }
  return <>
    <span className="eyebrow">CONTROL GENERAL</span>
    <h1>Panel general</h1>
    <div className="grid">
      <div className="card col4"><span>Pagos pendientes</span><div className="metric">{pending || 0}</div></div>
      <div className="card col4"><span>Participantes</span><div className="metric">{participants || 0}</div></div>
      <div className="card col4"><span>Recaudación aprobada</span><div className="metric">{money(revenue)}</div></div>
    </div>
    <div className="secondary">
      <div><h2>{active?.name || 'No hay un sorteo activo'}</h2><p>{active ? raffleStatusLabel(active.status) : 'Entra a Sorteos para activar uno y publicarlo.'}</p></div>
      <div className="actions"><Link className="outline" href="/admin/sorteos">GESTIONAR SORTEOS</Link><Link className="primary" href="/admin/pagos">VALIDAR PAGOS</Link></div>
    </div>
  </>
}
