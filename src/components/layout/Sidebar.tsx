import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export interface NavItem {
  icon:string; label:string; path:string; badge?:number; section?:string
}

export default function Sidebar({ items, basePath }:{ items:NavItem[]; basePath:string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, reset } = useAuthStore()
  const { dark, toggle }   = useThemeStore()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    reset(); navigate('/'); toast.success('Logged out')
  }

  const W = collapsed ? 64 : 240
  const roleColor:Record<string,string> = { admin:'#7c3aed', provider:'#16a34a', customer:'#f97316' }
  const color = roleColor[profile?.role ?? 'customer'] ?? '#f97316'

  return (
    <aside style={{
      width:W, minWidth:W, maxWidth:W, minHeight:'100vh', height:'100vh',
      background:'var(--card)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column', position:'sticky', top:0,
      flexShrink:0, transition:'width 0.2s ease, min-width 0.2s ease',
      overflow:'hidden', zIndex:40,
    }}>
      {/* Logo */}
      <div style={{ height:60, display:'flex', alignItems:'center', justifyContent:collapsed?'center':'space-between', padding:collapsed?'0 14px':'0 16px', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        {!collapsed && (
          <div style={{ display:'flex', alignItems:'center', gap:9, cursor:'pointer', minWidth:0 }} onClick={()=>navigate('/')}>
            <div style={{ width:30, height:30, background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>⚡</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:14, lineHeight:1, whiteSpace:'nowrap' }}>POWER<span style={{ color:'#f97316' }}>STAR</span></div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>City Services</div>
            </div>
          </div>
        )}
        {collapsed && <div style={{ width:30, height:30, background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, cursor:'pointer' }} onClick={()=>navigate('/')}>⚡</div>}
        <button onClick={()=>setCollapsed(c=>!c)} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:11, color:'var(--text3)', flexShrink:0, padding:0, marginLeft:collapsed?0:6 }}>
          {collapsed?'›':'‹'}
        </button>
      </div>

      {/* User */}
      {!collapsed ? (
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10, flexShrink:0, cursor:'pointer' }} onClick={()=>navigate(basePath+'/profile')}>
          <Avatar name={profile?.full_name} size={34} color={color}/>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:13, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{profile?.full_name||'User'}</p>
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:color, flexShrink:0 }}/>
              <span style={{ fontSize:10, color:'var(--text3)', fontWeight:600, textTransform:'capitalize' }}>{profile?.role}</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding:'10px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'center', flexShrink:0 }}>
          <Avatar name={profile?.full_name} size={32} color={color}/>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex:1, padding:'8px', overflowY:'auto', overflowX:'hidden' }}>
        {items.map((item,i) => {
          const isActive = item.path === basePath
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path)
          return (
            <div key={i}>
              {item.section && !collapsed && <p style={{ padding:'12px 8px 4px', fontSize:9, fontWeight:800, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px' }}>{item.section}</p>}
              <div onClick={()=>navigate(item.path)} title={collapsed?item.label:undefined}
                style={{ display:'flex', alignItems:'center', gap:collapsed?0:10, padding:collapsed?'10px':'9px 10px', margin:'1px 0', borderRadius:10, justifyContent:collapsed?'center':'flex-start', cursor:'pointer', transition:'all 0.15s', background:isActive?'rgba(249,115,22,0.08)':'transparent', border:`1.5px solid ${isActive?'rgba(249,115,22,0.2)':'transparent'}`, color:isActive?'#f97316':'var(--text2)', position:'relative' }}
                onMouseEnter={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background='var(--bg2)'}}
                onMouseLeave={e=>{if(!isActive)(e.currentTarget as HTMLElement).style.background='transparent'}}>
                {isActive&&!collapsed&&<div style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, background:'#f97316', borderRadius:'0 3px 3px 0' }}/>}
                <span style={{ fontSize:17, flexShrink:0, width:20, textAlign:'center' }}>{item.icon}</span>
                {!collapsed&&<span style={{ fontSize:13, fontWeight:isActive?700:500, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.label}</span>}
                {!collapsed&&!!item.badge&&<span style={{ background:'#f97316', color:'#fff', fontSize:9, fontWeight:800, padding:'1px 6px', borderRadius:20, minWidth:18, textAlign:'center', flexShrink:0 }}>{item.badge}</span>}
                {collapsed&&!!item.badge&&<div style={{ position:'absolute', top:6, right:6, width:7, height:7, background:'#f97316', borderRadius:'50%' }}/>}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop:'1px solid var(--border)', padding:'8px', flexShrink:0 }}>
        <div onClick={toggle} style={{ display:'flex', alignItems:'center', gap:collapsed?0:10, padding:collapsed?'9px':'9px 10px', borderRadius:10, cursor:'pointer', justifyContent:collapsed?'center':'flex-start', marginBottom:2, color:'var(--text2)', transition:'background 0.15s' }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='var(--bg2)'}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
          <span style={{ fontSize:17, flexShrink:0, width:20, textAlign:'center' }}>{dark?'☀️':'🌙'}</span>
          {!collapsed&&<span style={{ fontSize:13, fontWeight:500 }}>{dark?'Light mode':'Dark mode'}</span>}
        </div>
        <div onClick={logout} style={{ display:'flex', alignItems:'center', gap:collapsed?0:10, padding:collapsed?'9px':'9px 10px', borderRadius:10, cursor:'pointer', justifyContent:collapsed?'center':'flex-start', color:'var(--text2)', transition:'all 0.15s' }}
          onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.background='rgba(239,68,68,0.08)';el.style.color='#ef4444'}}
          onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.background='transparent';el.style.color='var(--text2)'}}>
          <span style={{ fontSize:17, flexShrink:0, width:20, textAlign:'center' }}>🚪</span>
          {!collapsed&&<span style={{ fontSize:13, fontWeight:500 }}>Logout</span>}
        </div>
      </div>
    </aside>
  )
}
