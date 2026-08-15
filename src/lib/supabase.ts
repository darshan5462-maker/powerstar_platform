import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL as string
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  console.error(
    '❌ Missing Supabase environment variables!\n' +
    'VITE_SUPABASE_URL:', url ? '✓ set' : '✗ MISSING',
    '\nVITE_SUPABASE_ANON_KEY:', anon ? '✓ set' : '✗ MISSING',
    '\n\nIf deployed on Vercel: Settings → Environment Variables → add both → Redeploy.'
  )
}

export const supabase = createClient(
  url || 'https://invalid.supabase.co',
  anon || 'invalid-key',
  {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
  }
)

