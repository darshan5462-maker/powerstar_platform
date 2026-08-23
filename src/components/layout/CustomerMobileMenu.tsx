import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

type Props = { open: boolean; onClose: () => void }

const ITEMS = [
  { icon:'🏠', label:'Dashboard', path:'/dashboard' },
  { icon:'➕', label:'Book Service', path:'/dashboard/book' },
  { icon:'📋', label:'My Bookings', path:'/dashboard/bookings' },
  { icon:'📍', label:'Live Tracking', path:'/dashboard/track' },
  { icon:'👤', label:'Profile', path:'/dashboard/profile' },
]

export default function CustomerMobileMenu({ open, onClose }: Props) {
  const { profile, reset } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return (
    <button className="mobile-menu-trigger" type="button" onClick={() => onClose()} aria-label="Open customer menu">☰</button>
  )

  async function logout() {
    await supabase.auth.signOut()
    reset()
    onClose()
    navigate('/auth', { replace:true })
  }

  return (
    <>
      <button className="mobile-menu-trigger is-open" type="button" onClick={onClose} aria-label="Close customer menu">×</button>
      <div className="mobile-drawer-backdrop" role="presentation" onClick={onClose}>
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Customer navigation" onClick={event => event.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>⚡</div>
              <div><p style={{ fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif' }}>POWER<span style={{ color:'var(--brand)' }}>STAR</span></p><p style={{ color:'var(--text3)', fontSize:10 }}>Customer menu</p></div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose} aria-label="Close menu" style={{ fontSize:24, padding:'4px 10px' }}>×</button>
          </div>

          <div className="mobile-drawer-profile">
            <div className="mobile-drawer-avatar">{(profile?.full_name ?? 'U').charAt(0).toUpperCase()}</div>
            <div><p style={{ fontWeight:700 }}>{profile?.full_name ?? 'Customer'}</p><p style={{ color:'var(--text2)', fontSize:12 }}>{profile?.district ?? 'Karnataka'}</p></div>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:6, marginTop:22 }}>
            {ITEMS.map(item => {
              const active = item.path === '/dashboard' ? location.pathname === item.path : location.pathname.startsWith(item.path)
              return <button key={item.path} type="button" className={`mobile-drawer-item${active ? ' active' : ''}`} onClick={() => { navigate(item.path); onClose() }}><span style={{ fontSize:20 }}>{item.icon}</span><span>{item.label}</span>{active && <span style={{ marginLeft:'auto', color:'var(--brand)' }}>●</span>}</button>
            })}
          </nav>

          <div style={{ marginTop:'auto', paddingTop:22, borderTop:'1px solid var(--border)' }}>
            <button type="button" className="mobile-drawer-item" onClick={() => void logout()}><span style={{ fontSize:20 }}>🚪</span><span>Logout</span></button>
          </div>
        </div>
      </div>
    </>
  )
}
