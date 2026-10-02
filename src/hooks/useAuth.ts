import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, Role } from '@/store/authStore'
import { fetchProfile } from '@/services/authService'

function resolveFallbackRole(user: any): Role {
  if (user?.user_metadata?.role) return user.user_metadata.role as Role
  const email = (user?.email || '').toLowerCase()
  if (email === 'admin@powerstar.in' || email.includes('admin')) return 'admin'
  if (email === 'provider@demo.com' || email.includes('provider')) return 'provider'
  return 'customer'
}

export function useAuth() {
  const { profile, isLoading, setProfile, setLoading, reset } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const dbProfile = await fetchProfile(session.user.id)
          setProfile(dbProfile)
        } catch {
          const role = resolveFallbackRole(session.user)
          setProfile({
            id: session.user.id,
            role,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            phone: session.user.user_metadata?.phone || '+91 98450 00000',
            district: session.user.user_metadata?.district || 'Bengaluru Urban',
            is_active: true
          })
        }
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        reset()
      } else if (session?.user) {
        try {
          const dbProfile = await fetchProfile(session.user.id)
          setProfile(dbProfile)
        } catch {
          const role = resolveFallbackRole(session.user)
          setProfile({
            id: session.user.id,
            role,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            phone: session.user.user_metadata?.phone || '+91 98450 00000',
            district: session.user.user_metadata?.district || 'Bengaluru Urban',
            is_active: true
          })
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { profile, isLoading }
}
