import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getCustomerBookings, subscribeToBookings } from '@/services/bookingService'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { MANPOWER } from '@/data/services'

const NEARBY = [
  { name:'Suresh Kumar',skill:'Plumber',dist:'1.2 km',rating:4.9 },
  { name:'Mahesh Reddy',skill:'Electrician',dist:'2.1 km',rating:4.7 },
  { name:'Kumar Swamy',skill:'Mason',dist:'3.4 km',rating:4.8 },
  { name:'Lakshmi Devi',skill:'Cleaning',dist:'0.8 km',rating:4.9 },
]

export default function CustomerHome() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    getCustomerBookings(profile.id).then(data => { setBookings(data); setLoading(false) })
    const ch = subscribeToBookings(() => getCustomerBookings(profile.id).then(setBookings))
    return () => { ch.unsubscribe() }
  }, [profile?.id])

  const active    = bookings.filter(b => b.status === 'active' || b.status === 'accepted')
  const completed = bookings.filter(b => b.status === 'completed')
  const totalSpent = completed.reduce((s, b) => s + (b.total_amount ?? 0), 0)
  const first = profile?.full_name?.split(' ')[0] ?? 'there'
  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <PageHeader
        title={`${greet}, ${first} 👋`}
        subtitle="Here's your service activity overview"
        action={<button className="btn btn-brand btn-sm" onClick={() => nav('/dashboard/book')}>+ Book Service</button>}
      />
      <div className="page-content">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          {[
            { icon:'📋', label:'Total Bookings', val: bookings.length || 0, sub: 'All time', color:'#f97316' },
            { icon:'🟢', label:'Active Now',     val: active.length || 0, sub: active.length ? 'Live tracking' : 'None active', color:'#16a34a' },
            { icon:'💰', label:'Total Spent',    val: totalSpent ? '₹'+totalSpent.toLocaleString('en-IN') : '₹0', sub: 'Completed jobs', color:'#2563eb' },
            { icon:'⭐', label:'Bookings Done',  val: completed.length || 0, sub: 'Completed', color:'#d97706' },
          ].map((s,i) => (
            <div key={i} className="glass" style={{ padding: 18 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:11, color:'var(--text2)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{s.label}</p>
                  <p style={{ fontSize:24, fontWeight:800, fontFamily:'Plus Jakarta Sans,sans-serif', color:s.color }}>{s.val}</p>
                  <p style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{s.sub}</p>
                </div>
                <div style={{ fontSize:22, opacity:0.5 }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Book */}
        <div className="glass" style={{ padding:20, marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <h3 style={{ fontWeight:700, fontSize:14 }}>Quick Book</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/dashboard/book')}>See all →</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(88px,1fr))', gap:8 }}>
            {MANPOWER.slice(0,10).map(s => (
              <div key={s.id} onClick={() => nav('/dashboard/book')}
                style={{ padding:'12px 6px', border:'1.5px solid var(--border)', borderRadius:10, textAlign:'center', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='#f97316'; el.style.background='rgba(249,115,22,0.06)' }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--border)'; el.style.background='transparent' }}
              >
                <div style={{ fontSize:22, marginBottom:5 }}>{s.icon}</div>
                <div style={{ fontSize:10, fontWeight:600, lineHeight:1.2, color:'var(--text)' }}>{s.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {/* Recent bookings - REAL DATA */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Recent Bookings</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => nav('/dashboard/bookings')}>View all →</button>
            </div>
            {loading ? (
              <div style={{ textAlign:'center', padding:'24px', color:'var(--text3)', fontSize:13 }}>Loading...</div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
                <p style={{ fontSize:13, color:'var(--text2)' }}>No bookings yet</p>
                <button className="btn btn-brand btn-sm" style={{ marginTop:10 }} onClick={() => nav('/dashboard/book')}>Book your first service</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {bookings.slice(0,5).map((b: any) => (
                  <div key={b.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, flexShrink:0 }}>
                      {b.category?.icon ?? '🔧'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.category?.name ?? 'Service'}</p>
                      <p style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>
                        {new Date(b.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} · ₹{b.total_amount?.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nearby providers */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Nearby Providers</h3>
              <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text2)' }}>
                <div className="live-dot" style={{ width:6, height:6 }} /> Live
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {NEARBY.map((p,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar name={p.name} size={36} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:600 }}>{p.name}</p>
                    <p style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{p.skill} · ★{p.rating} · {p.dist}</p>
                  </div>
                  <div className="live-dot" />
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-sm" style={{ width:'100%', marginTop:14 }} onClick={() => nav('/dashboard/book')}>
              Book a provider →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
