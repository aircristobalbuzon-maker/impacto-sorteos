import { requireAdmin } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { money } from '@/lib/format'
import { paymentStatusLabel } from '@/lib/status-labels'

export default async function Page({ searchParams }: { searchParams: Promise<{ whatsapp?: string }> }) {
  const { whatsapp } = await searchParams
  const { supabase: db } = await requireAdmin()
  const { data: rows } = await db.from('payments').select('id,status,created_at,proof_path,purchases(quantity,total_cents,participants(full_name,document,whatsapp),raffles(name))').order('created_at', { ascending: false })
  const storage = adminClient().storage.from('payment-proofs')
  const proofUrls = new Map<string, string>()
  await Promise.all((rows || []).map(async payment => {
    const { data } = await storage.createSignedUrl(payment.proof_path, 3600)
    if (data?.signedUrl) proofUrls.set(payment.id, data.signedUrl)
  }))

  return <>
    <span className="eyebrow">VALIDACIÓN MANUAL</span>
    <h1>Pagos</h1>
    <p className="muted">Revisa el comprobante antes de aprobar. Al aprobar, el sistema asigna automáticamente los tickets.</p>
    {whatsapp === 'sent' && <p className="success">Pago aprobado, tickets creados y notificación enviada por WhatsApp.</p>}
    {whatsapp === 'failed' && <p className="notice"><b>Pago aprobado y tickets creados.</b><br/>WhatsApp rechazó el mensaje. Revisa la configuración o envía los tickets manualmente.</p>}
    {whatsapp === 'unconfigured' && <p className="notice"><b>Pago aprobado y tickets creados.</b><br/>Falta conectar las credenciales de WhatsApp Business para enviar la notificación automática.</p>}
    <div className="card table-wrap"><table>
      <thead><tr><th>Participante</th><th>Sorteo</th><th>Tickets</th><th>Importe</th><th>Comprobante</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>{rows?.map((payment: any) => <tr key={payment.id}>
        <td><b>{payment.purchases.participants.full_name}</b><br/><small>{payment.purchases.participants.document} · {payment.purchases.participants.whatsapp}</small></td>
        <td>{payment.purchases.raffles.name}</td><td>{payment.purchases.quantity}</td><td>{money(payment.purchases.total_cents)}</td>
        <td>{proofUrls.get(payment.id) ? <a className="outline compact" href={proofUrls.get(payment.id)} target="_blank" rel="noreferrer">VER COMPROBANTE</a> : <span className="muted">No disponible</span>}</td>
        <td><span className="status">{paymentStatusLabel(payment.status)}</span></td>
        <td>{payment.status === 'PENDING' && <div className="actions"><form action={`/api/admin/payments/${payment.id}/approve`} method="post"><button>APROBAR</button></form><form action={`/api/admin/payments/${payment.id}/reject`} method="post"><button className="outline">RECHAZAR</button></form></div>}</td>
      </tr>)}</tbody>
    </table></div>
  </>
}
