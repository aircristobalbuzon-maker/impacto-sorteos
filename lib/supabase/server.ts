import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bgqdjlbfucavavdhanxm.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncWRqbGJmdWNhdmF2ZGhhbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzc4MzksImV4cCI6MjEwNTY1MzgzOX0.T5KklEUHS2RWq8U8Qw7E5B3aBUenTb6pG8zU-WiakYw'

export async function createClient() {
  const store = await cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
