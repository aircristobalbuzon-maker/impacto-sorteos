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

  return <main className="page raffle-page">
    <header className="raffle-heading">
      <div className="raffle-brand"><strong>IMPACTO</strong><span>PLATAFORMA OFICIAL DE SORTEOS</span></div>
      <span className="active-pill">{open ? '● SORTEO ACTIVO' : 'VENTAS CERRADAS'}</span>
      <h1>{raffle.name}</h1>
      <p>{raffle.description}</p>
      <div className="raffle-facts">
        <div><small>PRECIO POR TICKET</small><strong>{money(raffle.price_cents)}</strong></div>
        <div><small>FECHA DEL SORTEO</small><strong>{new Date(raffle.draws_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></div>
      </div>
    </header>

    {raffle.banner_url && <img src={raffle.banner_url} alt={`Portada de ${raffle.name}`} className="raffle-banner" />}

    {open ? <PurchaseForm
      slug={slug}
      raffleName={raffle.name}
      price={raffle.price_cents}
      yapeNumber={raffle.yape_number}
      yapeRecipient={raffle.yape_recipient}
    /> : <section className="card closed-card"><h2>Este sorteo ya no recibe participaciones</h2><p>Puedes consultar tus tickets o revisar los resultados desde el menú.</p></section>}

    <section className="validation-note">
      <b>VALIDACIÓN MANUAL Y SEGURA</b>
      <p>Revisamos cada comprobante antes de activar los tickets. Puede tomar algunos minutos o hasta el siguiente día hábil fuera del horario de atención.</p>
    </section>
    <section className="terms-card"><h3>Bases y condiciones</h3><p>{raffle.terms}</p></section>
  </main>
}
