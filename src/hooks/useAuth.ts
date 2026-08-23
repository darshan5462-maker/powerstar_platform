import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadProfile(session.user.id, session.user.email)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          reset()
          setLoading(false)
          return
        }
        if (session?.user) {
          await loadProfile(session.user.id, session.user.email)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string, _email?: string | null) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      if (!data || data.is_active === false) {
        reset()
        return
      }

      // Roles are trusted only after they are read from the protected profile row.
      setProfile(data)
    } catch {
      // Do not create a local fallback profile: that could grant an unverified role.
      reset()
    }
  }

  return { profile, isLoading }
}
