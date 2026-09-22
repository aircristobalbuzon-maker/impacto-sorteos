import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { money } from '@/lib/format'
import PurchaseForm from '@/components/raffles/PurchaseForm'

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = await createClient()
  const { data: raffle } = await db.from('raffles').select('*').eq('slug', slug).single()
  if (!raffle) notFound()
  const open = raffle.status === 'ACTIVE'
  return <main className="page">
    <span className="eyebrow">SORTEO OFICIAL IMPACTO</span><h1>{raffle.name}</h1>
    <div className="grid">
      <section className="card col8">
        {raffle.banner_url && <img src={raffle.banner_url} alt={`Portada de ${raffle.name}`} className="raffle-banner"/>}
        <p className="lead">{raffle.description}</p><h2>{money(raffle.price_cents)} por ticket</h2>
        <p><b>Fecha del sorteo:</b> {new Date(raffle.draws_at).toLocaleString('es-PE')}</p>
        <div className="notice"><b>Validación manual</b><p>Después de enviar el comprobante, revisaremos el pago. Puede tomar algunos minutos o hasta el siguiente día hábil fuera del horario de atención.</p></div>
      </section>
      <aside className="card col4"><span className="eyebrow">PASO 1</span><h2>{open ? 'Elige tus tickets' : 'Ventas cerradas'}</h2>{open ? <PurchaseForm slug={slug} price={raffle.price_cents}/> : <p>Este sorteo ya no acepta nuevas compras.</p>}</aside>
      <section className="card col8"><span className="eyebrow">PASO 2</span><h2>Paga por Yape</h2><div className="yape-data"><strong>{raffle.yape_number}</strong><span>{raffle.yape_recipient}</span></div><p className="muted">Haz el pago por el total indicado y guarda una captura del comprobante para adjuntarla en el formulario.</p></section>
      <section className="card col4"><span className="eyebrow">PASO 3</span><h2>Consulta tus tickets</h2><p>Después de la validación podrás encontrarlos con tu documento o WhatsApp.</p><a className="outline" href="/mis-tickets">CONSULTAR TICKETS</a></section>
      <section className="card col12"><h3>Bases y condiciones</h3><p className="muted terms">{raffle.terms}</p></section>
    </div>
  </main>
}
