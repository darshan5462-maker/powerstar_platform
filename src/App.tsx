import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'

import LandingPage       from './pages/LandingPage'
import AuthPage          from './pages/AuthPage'
import CustomerDashboard from './pages/CustomerDashboard'
import ProviderDashboard from './pages/ProviderDashboard'
import AdminDashboard    from './pages/AdminDashboard'

function Spinner() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:48,height:48,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,margin:'0 auto 12px',animation:'spin 1s linear infinite'}}>⚡</div>
        <p style={{color:'var(--text2)',fontSize:13}}>Loading POWERSTAR…</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

function Guard({ role, children }: { role:string; children:React.ReactNode }) {
  const { profile, isLoading } = useAuthStore()
  if (isLoading) return <Spinner />
  if (!profile)  return <Navigate to="/auth" replace />
  if (profile.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function Root() {
  const { profile, isLoading } = useAuth()
  if (isLoading) return <Spinner />
  if (profile) {
    if (profile.role === 'admin')    return <Navigate to="/admin" replace />
    if (profile.role === 'provider') return <Navigate to="/provider" replace />
    return <Navigate to="/dashboard" replace />
  }
  return <LandingPage />
}

export default function App() {
  useAuth() // Initialize auth listener globally
  return (
    <Routes>
      <Route path="/"    element={<Root />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard/*" element={<Guard role="customer"><CustomerDashboard /></Guard>} />
      <Route path="/provider/*"  element={<Guard role="provider"><ProviderDashboard /></Guard>} />
      <Route path="/admin/*"     element={<Guard role="admin"><AdminDashboard /></Guard>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
