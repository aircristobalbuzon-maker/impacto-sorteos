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
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('UNAUTHORIZED')

  // `admins` is protected by RLS. Use the SECURITY DEFINER helper instead of
  // reading the table directly so an authenticated administrator can be
  // authorized even when no SELECT policy exists on that table.
  const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
  if (adminError) throw adminError
  if (!isAdmin) throw new Error('FORBIDDEN')

  return { supabase, user }
}
