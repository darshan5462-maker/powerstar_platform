import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/Badge'

const QUICK = [
  { icon:'⚡', name:'Electrician', color:'#f59e0b', bg:'rgba(245,158,11,0.12)' },
  { icon:'🔧', name:'Plumber',     color:'#3b82f6', bg:'rgba(59,130,246,0.12)' },
  { icon:'🧱', name:'Mason',       color:'#8b5cf6', bg:'rgba(139,92,246,0.12)' },
  { icon:'🧹', name:'Cleaning',    color:'#10b981', bg:'rgba(16,185,129,0.12)' },
  { icon:'🚐', name:'Tata Ace',    color:'#f97316', bg:'rgba(249,115,22,0.12)' },
  { icon:'🚗', name:'Driver',      color:'#06b6d4', bg:'rgba(6,182,212,0.12)'  },
  { icon:'🏗️', name:'JCB',        color:'#ef4444', bg:'rgba(239,68,68,0.12)'  },
  { icon:'💪', name:'Loading',     color:'#84cc16', bg:'rgba(132,204,22,0.12)' },
]

const BANNERS = [
  { bg:'linear-gradient(135deg,#f97316,#ea580c)', title:'Book verified workers', body:'KYC-checked providers only. Work guarantee on every job.', icon:'🛡️' },
  { bg:'linear-gradient(135deg,#7c3aed,#6d28d9)', title:'31 districts covered',  body:'POWERSTAR serves all of Karnataka — urban and rural.',    icon:'📍' },
  { bg:'linear-gradient(135deg,#0f766e,#0d9488)', title:'Live GPS tracking',      body:'Track your provider in real-time after booking.',          icon:'🗺️' },
]

export default function CustomerHome() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [banner,   setBanner]   = useState(0)

  const hour  = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const first = profile?.full_name?.split(' ')[0] ?? 'there'

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('bookings')
      .select('*, category:service_categories(name,icon)')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setBookings(data ?? []); setLoading(false) })
  }, [profile?.id])

  useEffect(() => {
    const t = setInterval(() => setBanner(b => (b + 1) % BANNERS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const active    = bookings.filter(b => ['pending','accepted','active'].includes(b.status))
  const completed = bookings.filter(b => b.status === 'completed')
  const totalSpent = completed.reduce((s, b) => s + (b.total_amount || 0), 0)

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', width:'100%' }}>

      {/* ── HEADER ── */}
      <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', padding:'20px 20px 32px', width:'100%', boxSizing:'border-box', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, background:'rgba(249,115,22,0.1)', borderRadius:'50%', filter:'blur(40px)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:3 }}>{greet} 👋</p>
              <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', margin:0 }}>{first}</h1>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:3 }}>📍 {profile?.district || 'Karnataka'}</p>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
              {active.length > 0 && (
                <button onClick={() => nav('/dashboard/track')}
                  style={{ background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:20, padding:'6px 12px', color:'#f97316', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#f97316', animation:'blink 1.2s ease-in-out infinite', flexShrink:0 }}/>
                  {active.length} Active
                </button>
              )}
              <button onClick={() => nav('/dashboard/profile')}
                style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, cursor:'pointer', flexShrink:0 }}>
                👤
              </button>
            </div>
          </div>
          {/* Search bar */}
          <div onClick={() => nav('/dashboard/book')}
            style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', border:'1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize:15 }}>🔍</span>
            <span style={{ fontSize:13, color:'rgba(255,255,255,0.55)' }}>Electrician, plumber, mason, driver...</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 16px', width:'100%', boxSizing:'border-box' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, margin:'16px 0' }}>
          {[
            { icon:'📋', val:bookings.length || 0,    label:'Bookings', color:'#f97316' },
            { icon:'✅', val:completed.length || 0,   label:'Completed',color:'#16a34a' },
            { icon:'💰', val:totalSpent > 0 ? '₹'+Math.round(totalSpent/1000)+'K' : '₹0', label:'Spent', color:'#2563eb' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--card)', borderRadius:14, padding:'14px 10px', textAlign:'center', border:'1px solid var(--border)' }}>
              <p style={{ fontSize:18, marginBottom:4 }}>{s.icon}</p>
              <p style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif', margin:0 }}>{s.val}</p>
              <p style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active booking alert */}
        {active.length > 0 && (
          <div onClick={() => nav('/dashboard/track')}
            style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(234,88,12,0.05))', border:'1.5px solid rgba(249,115,22,0.25)', borderRadius:16, padding:14, marginBottom:14, cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
              {active[0]?.category?.icon ?? '🔧'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:800, fontSize:13, color:'var(--brand)', margin:0 }}>Active Booking</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {active[0]?.category?.name} · {active[0]?.district}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
              <div className="live-dot" style={{ width:7, height:7 }}/>
              <span style={{ fontSize:12, color:'var(--brand)', fontWeight:700 }}>Track →</span>
            </div>
          </div>
        )}

        {/* Banner — fixed height, no text overlap */}
        <div style={{ borderRadius:16, overflow:'hidden', marginBottom:18, height:100, position:'relative' }}>
          {BANNERS.map((b, i) => (
            <div key={i} style={{
              position:'absolute', inset:0,
              background:b.bg, padding:'16px 18px',
              display:'flex', alignItems:'center', gap:14,
              opacity: i === banner ? 1 : 0,
              transition:'opacity 0.6s ease',
              pointerEvents: i === banner ? 'auto' : 'none',
            }}>
              <span style={{ fontSize:30, flexShrink:0 }}>{b.icon}</span>
              <div style={{ minWidth:0 }}>
                <p style={{ fontWeight:800, fontSize:14, color:'#fff', margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.title}</p>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.8)', marginTop:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.body}</p>
              </div>
            </div>
          ))}
          {/* Dots */}
          <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', display:'flex', gap:5, zIndex:2 }}>
            {BANNERS.map((_,i) => (
              <div key={i} onClick={() => setBanner(i)}
                style={{ width:i===banner?18:5, height:5, borderRadius:3, background:'rgba(255,255,255,0.8)', cursor:'pointer', transition:'width 0.3s' }}/>
            ))}
          </div>
        </div>

        {/* Quick services */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontWeight:800, fontSize:15, fontFamily:'Plus Jakarta Sans,sans-serif', margin:0 }}>Book a Service</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/dashboard/book')} style={{ fontSize:11 }}>See all →</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {QUICK.map((s,i) => (
              <div key={i} onClick={() => nav('/dashboard/book')}
                style={{ background:'var(--card)', borderRadius:14, padding:'12px 6px', textAlign:'center', cursor:'pointer', border:'1px solid var(--border)', transition:'all 0.2s' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 6px 16px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow='' }}>
                <div style={{ width:38, height:38, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, margin:'0 auto 6px' }}>{s.icon}</div>
                <p style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.2, margin:0 }}>{s.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h2 style={{ fontWeight:800, fontSize:15, fontFamily:'Plus Jakarta Sans,sans-serif', margin:0 }}>Recent Bookings</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/dashboard/bookings')} style={{ fontSize:11 }}>View all →</button>
          </div>

          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2].map(i => <div key={i} style={{ background:'var(--card)', borderRadius:14, height:72, border:'1px solid var(--border)', animation:'shimmer 1.5s ease infinite' }}/>)}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ background:'var(--card)', borderRadius:16, padding:'28px 16px', textAlign:'center', border:'1px solid var(--border)' }}>
              <p style={{ fontSize:36, marginBottom:10 }}>🛠️</p>
              <p style={{ fontWeight:700, fontSize:14, marginBottom:6 }}>No bookings yet</p>
              <p style={{ color:'var(--text2)', fontSize:12, marginBottom:14 }}>Book your first service today!</p>
              <button className="btn btn-brand" style={{ width:'100%', padding:'12px', borderRadius:12 }} onClick={() => nav('/dashboard/book')}>+ Book a Service</button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {bookings.map((b:any) => (
                <div key={b.id}
                  onClick={() => ['pending','accepted','active'].includes(b.status) ? nav('/dashboard/track') : nav('/dashboard/bookings')}
                  style={{ background:'var(--card)', borderRadius:14, padding:14, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, cursor:'pointer', transition:'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='rgba(249,115,22,0.3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border)'}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'rgba(249,115,22,0.08)', border:'1.5px solid rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {b.category?.icon ?? '🔧'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700, fontSize:13, margin:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.category?.name ?? 'Service'}</p>
                    <p style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>
                      {new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})} · {b.district}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontWeight:800, fontSize:13, color:'var(--brand)', marginBottom:4 }}>₹{(b.total_amount||0).toLocaleString('en-IN')}</p>
                    <StatusBadge status={b.status}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
