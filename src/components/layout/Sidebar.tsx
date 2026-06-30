import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export interface NavItem {
  icon: string; label: string; path: string
  badge?: number; section?: string
}

interface SidebarProps { items: NavItem[]; basePath: string }

export default function Sidebar({ items, basePath }: SidebarProps) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { profile, reset } = useAuthStore()
  const { dark, toggle }   = useThemeStore()
  const [collapsed, setCollapsed] = useState(false)
  const [hoveredPath, setHoveredPath] = useState<string|null>(null)

  // auto-collapse on small screens
  useEffect(() => {
    const check = () => setCollapsed(window.innerWidth < 1100)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  async function logout() {
    await supabase.auth.signOut(); reset(); navigate('/'); toast.success('Logged out')
  }

  const W = collapsed ? 64 : 240

  return (
    <aside style={{
      width: W, minHeight: '100vh', background: 'var(--card)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
      transition: 'width 0.25s ease', overflow: 'hidden', zIndex: 40,
    }}>
      {/* Logo + collapse btn */}
      <div style={{ padding: '16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8, minHeight: 60, flexShrink: 0 }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>⚡</div>
            <span style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap' }}>POWER<span style={{ color: '#f97316' }}>STAR</span></span>
          </div>
        )}
        {collapsed && (
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#f97316,#ea580c)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer' }} onClick={() => navigate('/')}>⚡</div>
        )}
        <button onClick={() => setCollapsed(c => !c)} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 11, color: 'var(--text2)', flexShrink: 0, padding: 0 }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Avatar name={profile?.full_name} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'User'}</p>
            <p style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize', marginTop: 1 }}>{profile?.role}</p>
          </div>
        </div>
      )}
      {collapsed && (
        <div style={{ padding: '10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <Avatar name={profile?.full_name} size={32} />
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {items.map((item, i) => {
          const isActive = location.pathname === item.path || (item.path !== basePath && location.pathname.startsWith(item.path))
          const isHovered = hoveredPath === item.path
          return (
            <div key={i}>
              {item.section && !collapsed && (
                <p style={{ padding: '10px 16px 3px', fontSize: 9, fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {item.section}
                </p>
              )}
              <div
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredPath(item.path)}
                onMouseLeave={() => setHoveredPath(null)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10,
                  padding: collapsed ? '10px' : '9px 12px',
                  margin: '1px 6px', borderRadius: 8,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: isActive ? 'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,88,12,0.06))' : isHovered ? 'var(--bg2)' : 'transparent',
                  border: isActive ? '1px solid rgba(249,115,22,0.2)' : '1px solid transparent',
                  color: isActive ? 'var(--brand)' : 'var(--text2)',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>}
                {!collapsed && !!item.badge && (
                  <span style={{ background: '#f97316', color: '#fff', fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 10, minWidth: 16, textAlign: 'center' }}>{item.badge}</span>
                )}
                {collapsed && !!item.badge && (
                  <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, background: '#f97316', borderRadius: '50%' }} />
                )}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom: theme + logout */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 6px', flexShrink: 0 }}>
        <div
          onClick={toggle}
          title="Toggle theme"
          style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, padding: collapsed ? '9px' : '9px 10px', borderRadius: 8, cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: 2, transition: 'all 0.15s', color: 'var(--text2)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <span style={{ fontSize: 17 }}>{dark ? '☀️' : '🌙'}</span>
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>{dark ? 'Light mode' : 'Dark mode'}</span>}
        </div>
        <div
          onClick={logout}
          title="Logout"
          style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, padding: collapsed ? '9px' : '9px 10px', borderRadius: 8, cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all 0.15s', color: 'var(--text2)' }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#fee2e2'; el.style.color = '#dc2626' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--text2)' }}
        >
          <span style={{ fontSize: 17 }}>🚪</span>
          {!collapsed && <span style={{ fontSize: 13, fontWeight: 500 }}>Logout</span>}
        </div>
      </div>
    </aside>
  )
}
