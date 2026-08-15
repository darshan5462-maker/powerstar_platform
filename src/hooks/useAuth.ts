import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { fetchProfile } from '@/services/authService'

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try { setProfile(await fetchProfile(session.user.id)) }
        catch { setProfile({ id:session.user.id, role:'customer', full_name:session.user.email?.split('@')[0]||'User', is_active:true }) }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try { setProfile(await fetchProfile(session.user.id)) }
        catch { setProfile({ id:session.user.id, role:'customer', full_name:session.user.email?.split('@')[0]||'User', is_active:true }) }
      } else { reset() }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { profile, isLoading }
}
