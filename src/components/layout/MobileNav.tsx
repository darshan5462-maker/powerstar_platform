// Bottom mobile navigation bar — shown only on small screens
// Add this inside CustomerDashboard.tsx and ProviderDashboard.tsx

import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface NavTab {
  icon:   string
  label:  string
  path:   string
  badge?: number
}

export function CustomerMobileNav() {
  const nav      = useNavigate()
  const location = useLocation()
  const { profile } = useAuthStore()
  const [activeBookings, setActiveBookings] = useState(0)
  const [notifications,  setNotifications]  = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    // Count active bookings
    supabase.from('bookings').select('id', { count:'exact' })
      .eq('customer_id', profile.id).in('status', ['pending','accepted','active'])
      .then(({ count }) => setActiveBookings(count ?? 0))
    // Count unread notifications
    supabase.from('notifications').select('id', { count:'exact' })
      .eq('user_id', profile.id).eq('is_read', false)
      .then(({ count }) => setNotifications(count ?? 0))
  }, [profile?.id, location.pathname])

  const tabs: NavTab[] = [
    { icon:'🏠', label:'Home',     path:'/dashboard' },
    { icon:'➕', label:'Book',     path:'/dashboard/book' },
    { icon:'📍', label:'Track',    path:'/dashboard/track',    badge: activeBookings > 0 ? activeBookings : undefined },
    { icon:'📋', label:'Bookings', path:'/dashboard/bookings' },
    { icon:'👤', label:'Profile',  path:'/dashboard/profile',  badge: notifications > 0 ? notifications : undefined },
  ]

  return <MobileNavBar tabs={tabs} />
}

export function ProviderMobileNav() {
  const nav      = useNavigate()
  const location = useLocation()
  const { profile } = useAuthStore()
  const [requests,      setRequests]      = useState(0)
  const [notifications, setNotifications] = useState(0)

  useEffect(() => {
    if (!profile?.id || !profile?.district) return
    supabase.from('bookings').select('id', { count:'exact' })
      .eq('status', 'pending').ilike('district', profile.district)
      .then(({ count }) => setRequests(count ?? 0))
    supabase.from('notifications').select('id', { count:'exact' })
      .eq('user_id', profile.id).eq('is_read', false)
      .then(({ count }) => setNotifications(count ?? 0))
  }, [profile?.id, profile?.district, location.pathname])

  const tabs: NavTab[] = [
    { icon:'🏠', label:'Home',     path:'/provider' },
    { icon:'📩', label:'Requests', path:'/provider/myjobs',  badge: requests > 0 ? requests : undefined },
    { icon:'💰', label:'Earnings', path:'/provider/earnings' },
    { icon:'⭐', label:'Reviews',  path:'/provider/reviews' },
    { icon:'👤', label:'Profile',  path:'/provider/profile', badge: notifications > 0 ? notifications : undefined },
  ]

  return <MobileNavBar tabs={tabs} />
}

function MobileNavBar({ tabs }: { tabs: NavTab[] }) {
  const nav      = useNavigate()
  const location = useLocation()

  return (
    <>
      {/* Spacer so content isn't hidden behind nav */}
      <div style={{ height:72, flexShrink:0, display:'block' }} className="mobile-nav-spacer" />

      <nav style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        height:     64,
        background: 'var(--card)',
        borderTop:  '1px solid var(--border)',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex:     100,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
      }} className="mobile-nav">
        {tabs.map((tab, i) => {
          const isActive = location.pathname === tab.path ||
            (tab.path !== '/dashboard' && tab.path !== '/provider' && location.pathname.startsWith(tab.path))
          return (
            <button key={i} onClick={() => nav(tab.path)}
              style={{
                flex: 1, display:'flex', flexDirection:'column', alignItems:'center',
                justifyContent:'center', gap:3, background:'none', border:'none',
                cursor:'pointer', padding:'6px 0', position:'relative',
                color: isActive ? 'var(--brand)' : 'var(--text3)',
                transition: 'all 0.18s ease',
              }}>
              {/* Active indicator */}
              {isActive && (
                <div style={{
                  position:'absolute', top:-1, left:'50%', transform:'translateX(-50%)',
                  width:32, height:3, background:'var(--brand)', borderRadius:'0 0 3px 3px',
                }}/>
              )}
              {/* Icon with badge */}
              <div style={{ position:'relative', display:'inline-block' }}>
                <span style={{
                  fontSize: isActive ? 22 : 20,
                  transition: 'font-size 0.18s ease',
                  filter: isActive ? 'none' : 'grayscale(0.3)',
                }}>
                  {tab.icon}
                </span>
                {!!tab.badge && (
                  <div style={{
                    position:'absolute', top:-4, right:-6,
                    background:'#ef4444', color:'#fff',
                    fontSize:9, fontWeight:800,
                    minWidth:16, height:16,
                    borderRadius:10, display:'flex',
                    alignItems:'center', justifyContent:'center',
                    padding:'0 3px', border:'2px solid var(--card)',
                  }}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: isActive ? 700 : 500,
                fontFamily:'Inter,sans-serif',
                color: isActive ? 'var(--brand)' : 'var(--text3)',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Only show on mobile */}
      <style>{`
        .mobile-nav { display: flex !important }
        .mobile-nav-spacer { display: block !important }
        @media (min-width: 768px) {
          .mobile-nav { display: none !important }
          .mobile-nav-spacer { display: none !important }
        }
      `}</style>
    </>
  )
}
