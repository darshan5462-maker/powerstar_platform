import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

type Props = { open: boolean; onClose: () => void }
type Item = { icon:string; label:string; path:string }

const ITEMS: Item[] = [
  { icon:'📊', label:'Dashboard', path:'/admin' },
  { icon:'📋', label:'All Bookings', path:'/admin/bookings' },
  { icon:'👷', label:'Providers', path:'/admin/providers' },
  { icon:'👥', label:'Customers', path:'/admin/customers' },
  { icon:'🔐', label:'KYC Review', path:'/admin/kyc' },
  { icon:'💳', label:'Payments', path:'/admin/payments' },
  { icon:'⚠️', label:'Disputes', path:'/admin/disputes' },
  { icon:'🏷️', label:'Services', path:'/admin/services' },
  { icon:'💰', label:'Pricing', path:'/admin/pricing' },
  { icon:'⚙️', label:'Settings', path:'/admin/settings' },
]

const BOTTOM_ITEMS: Item[] = [ITEMS[0], ITEMS[1], ITEMS[2], ITEMS[4], ITEMS[9]]

function isActive(pathname: string, path: string) {
  return path === '/admin' ? pathname === path : pathname.startsWith(path)
}

export function AdminMobileNav() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <>
      <div className="mobile-nav-spacer" style={{ height:64, flexShrink:0 }} />
      <nav className="mobile-bottom-nav" aria-label="Admin mobile navigation" style={{ position:'fixed', bottom:0, left:0, right:0, height:60, background:'var(--card)', borderTop:'1px solid var(--border)', alignItems:'stretch', zIndex:200, paddingBottom:'env(safe-area-inset-bottom)', boxShadow:'0 -2px 20px rgba(0,0,0,0.08)' }}>
        {BOTTOM_ITEMS.map(item => {
          const active = isActive(location.pathname, item.path)
          return <button key={item.path} type="button" onClick={() => navigate(item.path)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 0', position:'relative', color:active?'#f97316':'var(--text3)', fontFamily:'Inter,sans-serif' }}>
            {active && <span style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:28, height:3, background:'#f97316', borderRadius:'0 0 3px 3px' }} />}
            <span style={{ fontSize:active?22:20, lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:10, lineHeight:1, fontWeight:active?700:500 }}>{item.label}</span>
          </button>
        })}
      </nav>
    </>
  )
}

export default function AdminMobileMenu({ open, onClose }: Props) {
  const { profile, reset } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open, onClose])

  if (!open) return <button className="mobile-menu-trigger" type="button" onClick={() => onClose()} aria-label="Open admin menu">☰</button>

  async function logout() {
    await supabase.auth.signOut()
    reset()
    onClose()
    navigate('/auth', { replace:true })
  }

  return (
    <>
      <button className="mobile-menu-trigger is-open" type="button" onClick={onClose} aria-label="Close admin menu">×</button>
      <div className="mobile-drawer-backdrop" role="presentation" onClick={onClose}>
        <div className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Admin navigation" onClick={event => event.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#f97316,#ea580c)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>⚡</div>
              <div><p style={{ fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif' }}>POWER<span style={{ color:'var(--brand)' }}>STAR</span></p><p style={{ color:'var(--text3)', fontSize:10 }}>Admin menu</p></div>
            </div>
            <button className="btn btn-ghost btn-sm" type="button" onClick={onClose} aria-label="Close menu" style={{ fontSize:24, padding:'4px 10px' }}>×</button>
          </div>

          <div className="mobile-drawer-profile">
            <div className="mobile-drawer-avatar">{(profile?.full_name ?? 'A').charAt(0).toUpperCase()}</div>
            <div style={{ minWidth:0 }}><p style={{ fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.full_name ?? 'Administrator'}</p><p style={{ color:'var(--text2)', fontSize:12 }}>Platform administrator</p></div>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:5, marginTop:20, overflowY:'auto' }}>
            {ITEMS.map(item => {
              const active = isActive(location.pathname, item.path)
              return <button key={item.path} type="button" className={`mobile-drawer-item${active?' active':''}`} onClick={() => { navigate(item.path); onClose() }}><span style={{ fontSize:19 }}>{item.icon}</span><span>{item.label}</span>{active && <span style={{ marginLeft:'auto', color:'var(--brand)' }}>●</span>}</button>
            })}
          </nav>

          <div style={{ marginTop:'auto', paddingTop:16, borderTop:'1px solid var(--border)' }}>
            <button type="button" className="mobile-drawer-item" onClick={() => void logout()}><span style={{ fontSize:19 }}>🚪</span><span>Logout</span></button>
          </div>
        </div>
      </div>
    </>
  )
}
