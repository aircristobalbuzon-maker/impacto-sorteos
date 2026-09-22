import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const store = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: (values) => values.forEach(({name,value,options}) => store.set(name,value,options)) }
  })
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('UNAUTHORIZED')
  const { data: admin } = await supabase.from('admins').select('role,active').eq('user_id', user.id).single()
  if (!admin?.active) throw new Error('FORBIDDEN')
  return { supabase, user, admin }
}
