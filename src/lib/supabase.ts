import { createClient } from '@supabase/supabase-js'
const url  = (import.meta.env.VITE_SUPABASE_URL  as string) || 'https://placeholder.supabase.co'
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder'
export const supabase = createClient(url, anon, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
})
