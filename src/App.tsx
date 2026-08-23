import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'

import LandingPage       from './pages/LandingPage'
import AuthPage          from './pages/AuthPage'
import CustomerDashboard from './pages/CustomerDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import AdminDashboard    from './pages/AdminDashboard'

function Spinner() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:16}}>
      <div style={{width:52,height:52,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 24px rgba(249,115,22,0.4)'}}>⚡</div>
      <div style={{width:32,height:32,border:'3px solid var(--border)',borderTop:'3px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
      <p style={{color:'var(--text2)',fontSize:13}}>Loading POWERSTAR…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function App() {
  const { profile, setProfile, setLoading, isLoading } = useAuthStore()
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    // Single source of truth for auth
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await resolveProfile(session.user.id, session.user.email ?? '')
      }
      setLoading(false)
      setBooting(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setProfile(null)
        setLoading(false)
        setBooting(false)
        return
      }
      if (session?.user) {
        await resolveProfile(session.user.id, session.user.email ?? '')
      }
      setLoading(false)
      setBooting(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function resolveProfile(userId: string, _email: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      // Never infer or create a role on the client. The database trigger/policy
      // is the source of truth for identity and authorization.
      if (!data || data.is_active === false) {
        setProfile(null)
        return
      }

      setProfile(data)
    } catch {
      // Fail closed when the profile cannot be verified.
      setProfile(null)
    }
  }

  if (booting) return <Spinner />

  if (!isSupabaseConfigured) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'var(--bg)' }}>
      <div className="glass" style={{ maxWidth:520, padding:28 }} role="alert">
        <p style={{ fontSize:32, marginBottom:12 }}>⚙️</p>
        <h1 style={{ fontSize:20, marginBottom:8 }}>Supabase configuration required</h1>
        <p style={{ color:'var(--text2)', lineHeight:1.6, fontSize:14 }}>
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your local environment or deployment settings, then restart the app.
        </p>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={
        profile
          ? <Navigate to={profile.role === 'admin' ? '/admin' : profile.role === 'provider' ? '/provider' : '/dashboard'} replace />
          : <LandingPage />
      } />
      <Route path="/auth" element={
        profile
          ? <Navigate to={profile.role === 'admin' ? '/admin' : profile.role === 'provider' ? '/provider' : '/dashboard'} replace />
          : <AuthPage />
      } />
      <Route path="/dashboard/*" element={
        !profile ? <Navigate to="/auth" replace /> :
        profile.role !== 'customer' ? <Navigate to={profile.role === 'admin' ? '/admin' : '/provider'} replace /> :
        <CustomerDashboard />
      } />
      <Route path="/provider/*" element={
        !profile ? <Navigate to="/auth" replace /> :
        profile.role !== 'provider' ? <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} replace /> :
        <ProviderDashboard />
      } />
      <Route path="/admin/*" element={
        !profile ? <Navigate to="/auth" replace /> :
        profile.role !== 'admin' ? <Navigate to="/dashboard" replace /> :
        <AdminDashboard />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
