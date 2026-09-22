import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try { await requireAdmin() } catch { redirect('/acceso-admin') }
  return <main className="admin-shell">
    <aside className="admin-nav">
      <b>ADMINISTRACIÓN IMPACTO</b>
      <Link href="/admin">Panel general</Link>
      <Link href="/admin/sorteos">Sorteos</Link>
      <Link href="/admin/pagos">Pagos</Link>
      <Link href="/admin/participantes">Participantes</Link>
      <Link href="/admin/tickets">Tickets</Link>
      <Link href="/admin/resultados">Resultados</Link>
      <Link href="/" target="_blank">Ver página pública ↗</Link>
    </aside>
    <section className="admin-content">{children}</section>
  </main>
}
