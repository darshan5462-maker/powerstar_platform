import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

type Props = { open: boolean; onClose: () => void }

const ITEMS = [
  { icon:'🏠', label:'Dashboard', path:'/provider' },
  { icon:'📩', label:'Job Requests', path:'/provider/jobs' },
  { icon:'📋', label:'My Jobs', path:'/provider/myjobs' },
  { icon:'💰', label:'Earnings', path:'/provider/earnings' },
  { icon:'⭐', label:'Reviews', path:'/provider/reviews' },
  { icon:'🔐', label:'KYC Documents', path:'/provider/kyc' },
  { icon:'👤', label:'Profile', path:'/provider/profile' },
]

export default function ProviderMobileMenu({ open, onClose }: Props) {
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
    <button className="mobile-menu-trigger" type="button" onClick={() => onClose()} aria-label="Open provider menu">☰</button>
  )

  async function logout() {
    await supabase.auth.signOut()
    reset()
    onClose()
    navigate('/auth', { replace:true })
  }

  return (
    <>
      <button className="mobile-menu-trigger is-open" type="button" onClick={onClose} aria-label="Close provider menu">×</button>
      <div className="mobile-drawer-backdrop" role="presentation" onClick={onClose}>
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Provider navigation" onClick={event => event.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>⚡</div>
              <div><p style={{ fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif' }}>POWER<span style={{ color:'var(--brand)' }}>STAR</span></p><p style={{ color:'var(--text3)', fontSize:10 }}>Provider menu</p></div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose} aria-label="Close menu" style={{ fontSize:24, padding:'4px 10px' }}>×</button>
          </div>

          <div className="mobile-drawer-profile">
            <div className="mobile-drawer-avatar">{(profile?.full_name ?? 'P').charAt(0).toUpperCase()}</div>
            <div style={{ minWidth:0 }}><p style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.full_name ?? 'Provider'}</p><p style={{ color:'var(--text2)', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.district ?? 'Karnataka'} · Provider</p></div>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:6, marginTop:22, overflowY:'auto' }}>
            {ITEMS.map(item => {
              const active = item.path === '/provider' ? location.pathname === item.path : location.pathname.startsWith(item.path)
              return <button key={item.path} type="button" className={`mobile-drawer-item${active ? ' active' : ''}`} onClick={() => { navigate(item.path); onClose() }}><span style={{ fontSize:20 }}>{item.icon}</span><span>{item.label}</span>{active && <span style={{ marginLeft:'auto', color:'var(--brand)' }}>●</span>}</button>
            })}
          </nav>

          <div style={{ marginTop:'auto', paddingTop:16, borderTop:'1px solid var(--border)' }}>
            <button type="button" className="mobile-drawer-item" onClick={() => void logout()}><span style={{ fontSize:20 }}>🚪</span><span>Logout</span></button>
          </div>
        </div>
      </div>
    </>
  )
}
