import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { MANPOWER, VEHICLES } from '@/data/services'
import { StatusBadge } from '@/components/ui/Badge'

const QUICK_SERVICES = [
  { icon:'⚡', name:'Electrician',  slug:'electrician',  color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  { icon:'🔧', name:'Plumber',      slug:'plumber',      color:'#3b82f6', bg:'rgba(59,130,246,0.1)' },
  { icon:'🧱', name:'Mason',        slug:'mason',        color:'#8b5cf6', bg:'rgba(139,92,246,0.1)' },
  { icon:'🧹', name:'Cleaning',     slug:'cleaning',     color:'#10b981', bg:'rgba(16,185,129,0.1)' },
  { icon:'🚐', name:'Tata Ace',     slug:'tata-ace',     color:'#f97316', bg:'rgba(249,115,22,0.1)' },
  { icon:'🚗', name:'Driver',       slug:'driver',       color:'#06b6d4', bg:'rgba(6,182,212,0.1)' },
  { icon:'🏗️', name:'JCB',         slug:'jcb',          color:'#ef4444', bg:'rgba(239,68,68,0.1)' },
  { icon:'💪', name:'Loading',      slug:'loading',      color:'#84cc16', bg:'rgba(132,204,22,0.1)' },
]

const BANNERS = [
  { bg:'linear-gradient(135deg,#f97316,#ea580c)', title:'First booking?', sub:'Get ₹100 off on your first service booking!', icon:'🎉', btn:'Claim Now' },
  { bg:'linear-gradient(135deg,#7c3aed,#6d28d9)', title:'Verified workers only', sub:'Every provider is KYC verified by our team', icon:'✅', btn:'Learn More' },
  { bg:'linear-gradient(135deg,#0f766e,#0d9488)', title:'31 districts covered', sub:'POWERSTAR serves all of Karnataka', icon:'📍', btn:'Check Area' },
]

export default function CustomerHome() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings,  setBookings]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [banner,    setBanner]    = useState(0)
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('bookings')
      .select('*, category:service_categories(name,icon)')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setBookings(data ?? []); setLoading(false) })
  }, [profile?.id])

  // Banner auto-scroll
  useEffect(() => {
    const t = setInterval(() => setBanner(b => (b+1) % BANNERS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const active    = bookings.filter(b => ['pending_admin','provider_assigned','payment_pending','payment_success','confirmed','in_progress'].includes(b.status))
  const completed = bookings.filter(b => b.status === 'completed')
  const totalSpent = completed.reduce((s,b) => s + (b.total_amount||0), 0)

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh' }}>

      {/* ── HEADER ── */}
      <div style={{ background:'linear-gradient(135deg,#1e293b,#0f172a)', padding:'20px 20px 28px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:'rgba(249,115,22,0.12)', borderRadius:'50%', filter:'blur(40px)' }} />
        <div style={{ position:'absolute', bottom:-30, left:-30, width:120, height:120, background:'rgba(37,99,235,0.1)', borderRadius:'50%', filter:'blur(30px)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
            <div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.6)', marginBottom:3 }}>{greet} 👋</p>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{firstName}</h1>
              <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:3 }}>📍 {profile?.district || 'Karnataka'}</p>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {active.length > 0 && (
                <button onClick={() => nav('/dashboard/track')}
                  style={{ background:'rgba(249,115,22,0.2)', border:'1px solid rgba(249,115,22,0.4)', borderRadius:20, padding:'7px 14px', color:'#f97316', fontSize:11, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#f97316', animation:'blink 1.2s ease-in-out infinite' }} />
                  {active.length} Active
                </button>
              )}
              <button onClick={() => nav('/dashboard/profile')}
                style={{ width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer' }}>
                👤
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div onClick={() => nav('/dashboard/book')}
            style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', border:'1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize:16 }}>🔍</span>
            <span style={{ fontSize:14, color:'rgba(255,255,255,0.6)' }}>Search electrician, plumber, mason...</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 16px', marginTop:-8 }}>

        {/* Stats strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
          {[
            { icon:'📋', val: bookings.length || 0, label:'Bookings', color:'#f97316' },
            { icon:'✅', val: completed.length || 0, label:'Completed', color:'#16a34a' },
            { icon:'💰', val: totalSpent > 0 ? '₹'+Math.round(totalSpent/1000)+'K' : '₹0', label:'Spent', color:'#2563eb' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--card)', borderRadius:14, padding:'14px 12px', textAlign:'center', border:'1px solid var(--border)', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize:20, marginBottom:4 }}>{s.icon}</p>
              <p style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.val}</p>
              <p style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Active booking alert */}
        {active.length > 0 && (
          <div onClick={() => nav('/dashboard/track')}
            style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,88,12,0.06))', border:'1.5px solid rgba(249,115,22,0.3)', borderRadius:16, padding:16, marginBottom:20, cursor:'pointer', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
              {active[0]?.category?.icon ?? '🔧'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:800, fontSize:14, color:'var(--brand)' }}>Active Booking</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {active[0]?.category?.name} · {active[0]?.district}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
              <div className="live-dot" style={{ width:7, height:7 }} />
              <span style={{ fontSize:12, color:'var(--brand)', fontWeight:700 }}>Track →</span>
            </div>
          </div>
        )}

        {/* Promo banner (Horizontal Swipe) */}
        <div className="h-scroll" style={{ marginBottom:22 }}>
          {BANNERS.map((b, i) => (
            <div key={i} className="h-scroll-item" style={{
              width: '85vw', maxWidth: 340, height: 110, background: b.bg, borderRadius: 16,
              padding: 20, display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <span style={{ fontSize:36, flexShrink:0 }}>{b.icon}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:800, fontSize:15, color:'#fff', marginBottom:3 }}>{b.title}</p>
                <p style={{ fontSize:12, color:'rgba(255,255,255,0.8)', marginBottom:8 }}>{b.sub}</p>
                <span style={{ background:'rgba(255,255,255,0.25)', borderRadius:20, padding:'3px 12px', fontSize:11, fontWeight:700, color:'#fff' }}>{b.btn}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick services */}
        <div style={{ marginBottom:22 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ fontWeight:800, fontSize:16, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Book a Service</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/dashboard/book')} style={{ fontSize:12 }}>See all →</button>
          </div>
          <div className="h-scroll">
            {QUICK_SERVICES.map((s, i) => (
              <div key={i} className="h-scroll-item" onClick={() => nav('/dashboard/book')}
                style={{ width:84, background:'var(--card)', borderRadius:14, padding:'14px 8px', textAlign:'center', cursor:'pointer', border:'1px solid var(--border)', transition:'all 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)' }}
                onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.transform=''; el.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ width:40, height:40, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, margin:'0 auto 8px' }}>
                  {s.icon}
                </div>
                <p style={{ fontSize:10, fontWeight:600, color:'var(--text)', lineHeight:1.2 }}>{s.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ fontWeight:800, fontSize:16, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Recent Bookings</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/dashboard/bookings')} style={{ fontSize:12 }}>View all →</button>
          </div>

          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background:'var(--card)', borderRadius:14, padding:16, height:76, border:'1px solid var(--border)', animation:'shimmer 1.5s ease infinite' }} />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ background:'var(--card)', borderRadius:16, padding:'32px 20px', textAlign:'center', border:'1px solid var(--border)' }}>
              <p style={{ fontSize:40, marginBottom:12 }}>🛠️</p>
              <p style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>No bookings yet</p>
              <p style={{ color:'var(--text2)', fontSize:13, marginBottom:16 }}>Book your first service and get it done today!</p>
              <button className="btn btn-brand" style={{ width:'100%', padding:'12px', borderRadius:12 }} onClick={() => nav('/dashboard/book')}>
                + Book a Service
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {bookings.map((b:any) => (
                <div key={b.id}
                  onClick={() => ['pending_admin','provider_assigned','payment_pending','payment_success','confirmed','in_progress'].includes(b.status) ? nav('/dashboard/track') : nav('/dashboard/bookings')}
                  style={{ background:'var(--card)', borderRadius:14, padding:16, border:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='rgba(249,115,22,0.3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border)'}>
                  <div style={{ width:46, height:46, borderRadius:13, background:'rgba(249,115,22,0.08)', border:'1.5px solid rgba(249,115,22,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                    {b.category?.icon ?? '🔧'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.category?.name ?? 'Service'}</p>
                    <p style={{ fontSize:11, color:'var(--text2)', marginTop:3 }}>
                      {new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})} · {b.district}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontWeight:800, fontSize:14, color:'var(--brand)', marginBottom:4 }}>₹{(b.total_amount||0).toLocaleString('en-IN')}</p>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Help section */}
        <div style={{ background:'var(--card)', borderRadius:16, padding:16, marginBottom:28, border:'1px solid var(--border)' }}>
          <p style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Need help?</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              { icon:'📞', label:'Call Support', action:()=>window.open('tel:+918045678900') },
              { icon:'💬', label:'Chat with us', action:()=>{} },
              { icon:'❓', label:'How it works', action:()=>{} },
              { icon:'⭐', label:'Rate our app', action:()=>{} },
            ].map((h,i)=>(
              <button key={i} onClick={h.action}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px', borderRadius:12, background:'var(--bg2)', border:'1px solid var(--border)', cursor:'pointer', fontFamily:'Inter,sans-serif', textAlign:'left' }}>
                <span style={{ fontSize:18 }}>{h.icon}</span>
                <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{h.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </div>
  )
}
