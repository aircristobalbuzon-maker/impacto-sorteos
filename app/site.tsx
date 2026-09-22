import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { money } from '@/lib/format'

export default async function Site() {
  const db = await createClient()
  const { data: raffles } = await db.from('raffles').select('*').in('status', ['ACTIVE', 'SALES_CLOSED', 'DRAWING']).order('draws_at')
  const active = raffles?.find(raffle => raffle.status === 'ACTIVE') || raffles?.[0]
  return <main>
    <section className="hero">
      <span className="eyebrow">SORTEOS OFICIALES · IMPACTO</span>
      <h1>PARTICIPA.<br/><em>VIVE LA EXPERIENCIA.</em></h1>
      <p>Compra tus tickets en pocos pasos. Regístrate, paga por Yape y envía tu comprobante. IMPACTO validará el pago y activará tus tickets.</p>
      {active ? <div className="actions"><Link className="primary" href={`/sorteo/${active.slug}`}>{active.status === 'ACTIVE' ? 'PARTICIPAR AHORA' : 'VER SORTEO'}</Link><Link className="outline" href="/mis-tickets">CONSULTAR MIS TICKETS</Link></div> : <span className="muted">Próximo sorteo en preparación</span>}
    </section>
    {active && <section className="feature">
      <div><span className="eyebrow">{active.status === 'ACTIVE' ? 'INSCRIPCIONES ABIERTAS' : 'VENTAS CERRADAS'}</span><h2>{active.name}</h2><p>{active.description}</p><strong>{money(active.price_cents)} por ticket</strong><p>Fecha del sorteo: {new Date(active.draws_at).toLocaleString('es-PE')}</p></div>
      <Link className="primary" href={`/sorteo/${active.slug}`}>{active.status === 'ACTIVE' ? 'ELEGIR TICKETS' : 'VER INFORMACIÓN'}</Link>
    </section>}
    <section className="how-to">
      <span className="eyebrow">CÓMO PARTICIPAR</span><h2>FÁCIL, CLARO Y SEGURO.</h2>
      <div className="grid">
        <article className="card col4"><b>01</b><h3>Elige tus tickets</h3><p>Selecciona la cantidad e ingresa tus datos.</p></article>
        <article className="card col4"><b>02</b><h3>Paga por Yape</h3><p>Realiza el pago y adjunta una foto del comprobante.</p></article>
        <article className="card col4"><b>03</b><h3>Recibe la confirmación</h3><p>Cuando validemos el pago, tus tickets quedarán participando.</p></article>
      </div>
    </section>
    <section className="secondary"><div><h3>¿Ya participas?</h3><p>Consulta tus tickets confirmados usando tu documento o WhatsApp.</p></div><Link className="outline" href="/mis-tickets">CONSULTAR MIS TICKETS</Link></section>
  </main>
}
