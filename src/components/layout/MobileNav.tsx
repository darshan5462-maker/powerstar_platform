import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface NavTab { icon:string; label:string; path:string; badge?:number }

// ── CUSTOMER BOTTOM NAV ─────────────────────────────────────
export function CustomerMobileNav() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const [activeBk, setActiveBk] = useState(0)
  const [notifs,   setNotifs]   = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('bookings').select('id', { count:'exact', head:true })
      .eq('customer_id', profile.id).in('status', ['pending','accepted','active'])
      .then(({ count }) => setActiveBk(count ?? 0))
    supabase.from('notifications').select('id', { count:'exact', head:true })
      .eq('user_id', profile.id).eq('is_read', false)
      .then(({ count }) => setNotifs(count ?? 0))
  }, [profile?.id, location.pathname])

  const tabs: NavTab[] = [
    { icon:'🏠', label:'Home',     path:'/dashboard'            },
    { icon:'➕', label:'Book',     path:'/dashboard/book'       },
    { icon:'📍', label:'Track',    path:'/dashboard/track',   badge: activeBk || undefined },
    { icon:'📋', label:'Bookings', path:'/dashboard/bookings'   },
    { icon:'👤', label:'Profile',  path:'/dashboard/profile', badge: notifs    || undefined },
  ]

  return <MobileNavBar tabs={tabs} basePath="/dashboard" />
}

// ── PROVIDER BOTTOM NAV ─────────────────────────────────────
export function ProviderMobileNav() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const [requests, setRequests] = useState(0)
  const [notifs,   setNotifs]   = useState(0)
  const [activeJob,setActiveJob]= useState(false)

  useEffect(() => {
    if (!profile?.id) return
    // Pending requests in provider's district
    if (profile.district) {
      supabase.from('bookings').select('id', { count:'exact', head:true })
        .eq('status','pending').ilike('district', profile.district)
        .then(({ count }) => setRequests(count ?? 0))
    }
    // Active/accepted job
    supabase.from('bookings').select('id', { count:'exact', head:true })
      .eq('provider_id', profile.id).in('status', ['accepted','active'])
      .then(({ count }) => setActiveJob((count ?? 0) > 0))
    // Unread notifications
    supabase.from('notifications').select('id', { count:'exact', head:true })
      .eq('user_id', profile.id).eq('is_read', false)
      .then(({ count }) => setNotifs(count ?? 0))
  }, [profile?.id, profile?.district, location.pathname])

  const tabs: NavTab[] = [
    { icon:'🏠', label:'Home',     path:'/provider',          badge: activeJob ? 1 : undefined },
    { icon:'📩', label:'Requests', path:'/provider/jobs',     badge: requests  || undefined     },
    { icon:'💰', label:'Earnings', path:'/provider/earnings'                                    },
    { icon:'🔐', label:'KYC',      path:'/provider/kyc'                                         },
    { icon:'👤', label:'Profile',  path:'/provider/profile',  badge: notifs    || undefined     },
  ]

  return <MobileNavBar tabs={tabs} basePath="/provider" />
}

// ── SHARED NAV BAR COMPONENT ────────────────────────────────
function MobileNavBar({ tabs, basePath }: { tabs: NavTab[]; basePath: string }) {
  const nav      = useNavigate()
  const location = useLocation()

  return (
    <>
      {/* Spacer so page content isn't hidden behind nav */}
      <div style={{ height:68 }} className="mobile-spacer" />

      <nav className="mobile-nav" style={{
        position:   'fixed',
        bottom:     0,
        left:       0,
        right:      0,
        height:     60,
        background: 'var(--card)',
        borderTop:  '1px solid var(--border)',
        display:    'flex',
        alignItems: 'stretch',
        zIndex:     200,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow:  '0 -2px 20px rgba(0,0,0,0.08)',
      }}>
        {tabs.map((tab, i) => {
          const isActive =
            tab.path === basePath
              ? location.pathname === tab.path || location.pathname === basePath + '/'
              : location.pathname.startsWith(tab.path)

          return (
            <button key={i} onClick={() => nav(tab.path)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, background: 'none', border: 'none',
                cursor: 'pointer', padding: '4px 0',
                position: 'relative',
                color: isActive ? 'var(--brand)' : 'var(--text3)',
                transition: 'color 0.15s',
              }}>

              {/* Top active indicator */}
              {isActive && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 28, height: 3,
                  background: 'var(--brand)',
                  borderRadius: '0 0 3px 3px',
                }} />
              )}

              {/* Icon + badge */}
              <div style={{ position: 'relative' }}>
                <span style={{
                  fontSize: isActive ? 22 : 20,
                  transition: 'font-size 0.15s',
                  display: 'block',
                  lineHeight: 1,
                }}>
                  {tab.icon}
                </span>
                {!!tab.badge && (
                  <div style={{
                    position: 'absolute', top: -5, right: -7,
                    background: '#ef4444', color: '#fff',
                    fontSize: 9, fontWeight: 800,
                    minWidth: 16, height: 16, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 3px', border: '2px solid var(--card)',
                    lineHeight: 1,
                  }}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </div>
                )}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>

      <style>{`
        /* Show only on mobile */
        .mobile-nav    { display: none }
        .mobile-spacer { display: none }
        @media (max-width: 767px) {
          .mobile-nav    { display: flex !important }
          .mobile-spacer { display: block !important }
          .desktop-only  { display: none !important }
          .page-content  { padding-bottom: 80px !important }
        }
      `}</style>
    </>
  )
}
