import { createClient } from '@supabase/supabase-js'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

export const isSupabaseConfigured = Boolean(url && anon)

// Keep a valid client during local build-time rendering, but expose the missing
// configuration explicitly so the app can fail with an actionable message.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anon || 'placeholder',
  { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } },
)
