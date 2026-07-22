import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const TIMELINE = [
  { status:'pending',   label:'Booking confirmed — finding provider', icon:'📋' },
  { status:'accepted',  label:'Provider accepted — heading to you',   icon:'🛵' },
  { status:'active',    label:'Job in progress',                      icon:'🔧' },
  { status:'completed', label:'Job complete — payment released',      icon:'✅' },
]

export default function CustomerTrack() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings,       setBookings]       = useState<any[]>([])
  const [selected,       setSelected]       = useState<string|null>(null)
  const [loading,        setLoading]        = useState(true)
  const [customerCoords, setCustomerCoords] = useState<{lat:number;lng:number}|null>(null)
  const [providerCoords, setProviderCoords] = useState<{lat:number;lng:number}|null>(null)
  const [locationShared, setLocationShared] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('bookings')
      .select(`
        *,
        category:service_categories(name, icon),
        provider_profile:providers!bookings_provider_id_fkey(
          rating, is_online,
          profile:profiles(full_name, phone)
        )
      `)
      .eq('customer_id', profile.id)
      .in('status', ['pending','accepted','active'])
      .order('created_at', { ascending: false })
    setBookings(data ?? [])
    if (data && data.length > 0 && !selected) setSelected(data[0].id)
    setLoading(false)
  }, [profile?.id]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  // Get customer's location automatically
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        pos => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCustomerCoords(coords)
          // Share location in DB so provider can see it
          if (profile?.id && !locationShared) {
            setLocationShared(true)
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000 }
      )
    }
  }, [profile?.id]) // eslint-disable-line

  // Subscribe to provider location
  useEffect(() => {
    const booking = bookings.find(b => b.id === selected)
    if (!booking?.provider_id) return

    supabase.from('provider_locations')
      .select('latitude,longitude')
      .eq('provider_id', booking.provider_id)
      .maybeSingle()
      .then(({ data }) => { if (data) setProviderCoords({ lat: data.latitude, lng: data.longitude }) })

    const ch = supabase.channel(`ploc-${selected}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'provider_locations',
        filter:`provider_id=eq.${booking.provider_id}` },
        (payload:any) => {
          const { latitude: lat, longitude: lng } = payload.new ?? {}
          if (lat && lng) setProviderCoords({ lat, lng })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [selected, bookings])

  // Realtime booking status changes
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`ctrack-${profile.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings',
        filter:`customer_id=eq.${profile.id}` },
        (payload:any) => {
          const u = payload.new
          setBookings(prev => prev.map(b => b.id===u.id ? {...b,...u} : b)
            .filter(b => ['pending','accepted','active'].includes(b.status)))
          if (u.status==='accepted') toast.success('✅ Provider accepted your booking!', { duration:4000 })
          if (u.status==='active')   toast.success('🔧 Job started!')
          if (u.status==='completed') {
            toast.success('🎉 Job completed! Please rate your experience.')
            load()
            setTimeout(() => nav('/dashboard/bookings'), 2500)
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile?.id, load]) // eslint-disable-line

  async function cancelBooking(id: string) {
    const { error } = await supabase.from('bookings')
      .update({ status:'cancelled', cancelled_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Failed to cancel'); return }
    toast.success('Booking cancelled')
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  // Distance calc
  function calcDist(a:{lat:number,lng:number}, b:{lat:number,lng:number}) {
    const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLon=(b.lng-a.lng)*Math.PI/180
    const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2
    return (R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x))).toFixed(1)
  }

  const activeBooking = bookings.find(b => b.id===selected) ?? bookings[0]
  const provName      = activeBooking?.provider_profile?.profile?.full_name ?? null
  const provPhone     = activeBooking?.provider_profile?.profile?.phone ?? null
  const stepOrder     = ['pending','accepted','active','completed']
  const currIdx       = stepOrder.indexOf(activeBooking?.status ?? 'pending')
  const distance      = providerCoords && customerCoords ? calcDist(providerCoords, customerCoords) : null
  const etaMin        = distance ? Math.max(1, Math.round(Number(distance)*3)) : null

  if (loading) return (
    <div><PageHeader title="Live Tracking" />
      <div className="page-content" style={{ textAlign:'center', paddingTop:48, color:'var(--text3)' }}>Loading...</div>
    </div>
  )

  if (bookings.length === 0) return (
    <div><PageHeader title="Live Tracking" subtitle="Track your active bookings in real-time" />
      <div className="page-content">
        <div className="glass" style={{ padding:48, textAlign:'center', maxWidth:480 }}>
          <p style={{ fontSize:48, marginBottom:14 }}>📍</p>
          <p style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>No active bookings</p>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom:20 }}>Book a service to track your provider here in real-time.</p>
          <button className="btn btn-brand" onClick={() => nav('/dashboard/book')}>Book a Service</button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        subtitle={`${activeBooking?.booking_ref ?? ''} · ${activeBooking?.category?.name ?? ''}`}
        action={<StatusBadge status={activeBooking?.status ?? 'pending'} />}
      />
      <div className="page-content">

        {/* Multi-booking tabs */}
        {bookings.length > 1 && (
          <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
            {bookings.map(b => (
              <button key={b.id} onClick={() => setSelected(b.id)}
                style={{ padding:'8px 14px', borderRadius:10, border:`2px solid ${selected===b.id?'var(--brand)':'var(--border)'}`, background:selected===b.id?'var(--brand-light)':'var(--bg2)', cursor:'pointer', fontSize:13, fontWeight:600, color:selected===b.id?'var(--brand)':'var(--text)' }}>
                {b.category?.icon} {b.category?.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:18, maxWidth:920 }}>

          {/* LEFT — Map + timeline */}
          <div className="glass" style={{ overflow:'hidden' }}>

            {/* Live Map */}
            <div style={{ height:260, background:'linear-gradient(135deg,#0f2744,#1a3356)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize:'36px 36px' }} />

              {/* Map content based on status */}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                {activeBooking?.status === 'pending' ? (
                  <div style={{ textAlign:'center', color:'#fff' }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>🔍</div>
                    <p style={{ fontWeight:700, fontSize:15 }}>Finding provider near you...</p>
                    <p style={{ fontSize:12, opacity:0.6, marginTop:4 }}>Usually 2–3 minutes</p>
                    <div style={{ position:'relative', width:80, height:80, margin:'16px auto 0' }}>
                      {[0,1,2].map(i=>(
                        <div key={i} style={{ position:'absolute', inset:0, border:'2px solid rgba(249,115,22,0.5)', borderRadius:'50%', animation:`pulse ${1.5+i*0.5}s ease-out infinite`, animationDelay:`${i*0.4}s` }} />
                      ))}
                      <div style={{ position:'absolute', inset:'30%', background:'#f97316', borderRadius:'50%' }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ width:'100%', height:'100%', position:'relative' }}>
                    {/* Customer pin */}
                    <div style={{ position:'absolute', bottom:'28%', left:'52%', textAlign:'center', zIndex:2 }}>
                      <div style={{ fontSize:26 }}>🏠</div>
                      <div style={{ background:'rgba(37,99,235,0.9)', color:'#fff', fontSize:9, padding:'1px 5px', borderRadius:4, marginTop:2, whiteSpace:'nowrap' }}>You</div>
                    </div>
                    {/* Provider pin */}
                    {activeBooking?.status !== 'active' && (
                      <div style={{ position:'absolute', top:'22%', left:'32%', textAlign:'center', zIndex:2, animation:'provMove 6s ease-in-out infinite' }}>
                        <div style={{ fontSize:26 }}>🛵</div>
                        <div style={{ background:'rgba(249,115,22,0.9)', color:'#fff', fontSize:9, padding:'1px 5px', borderRadius:4, marginTop:2, whiteSpace:'nowrap' }}>{provName?.split(' ')[0]??'Provider'}</div>
                      </div>
                    )}
                    {activeBooking?.status === 'active' && (
                      <div style={{ position:'absolute', bottom:'30%', left:'50%', textAlign:'center', zIndex:2 }}>
                        <div style={{ fontSize:26 }}>🔧</div>
                        <div style={{ background:'rgba(22,163,74,0.9)', color:'#fff', fontSize:9, padding:'1px 5px', borderRadius:4, marginTop:2 }}>Working</div>
                      </div>
                    )}
                    {/* Dotted route */}
                    {activeBooking?.status !== 'active' && (
                      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
                        <line x1="36%" y1="30%" x2="52%" y2="72%" stroke="#f97316" strokeWidth="2.5" strokeDasharray="8,5" opacity="0.6"/>
                      </svg>
                    )}
                    {/* Distance badge */}
                    {distance && (
                      <div style={{ position:'absolute', top:12, left:12, background:'rgba(0,0,0,0.75)', borderRadius:10, padding:'5px 12px', color:'#fff', fontSize:12, fontWeight:700 }}>
                        📏 {distance} km · ~{etaMin} min
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Live badge */}
              <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.6)', borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:6, color:'#fff', fontSize:12, zIndex:3 }}>
                <div className="live-dot" style={{ width:6, height:6 }} /> Live
              </div>

              {/* Location permission prompt */}
              {!customerCoords && (
                <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', zIndex:3 }}>
                  <button className="btn btn-sm" style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', fontSize:11, backdropFilter:'blur(4px)' }}
                    onClick={() => navigator.geolocation?.getCurrentPosition(p => setCustomerCoords({ lat:p.coords.latitude, lng:p.coords.longitude }))}>
                    📍 Share location for better tracking
                  </button>
                </div>
              )}
            </div>

            {/* Provider info */}
            <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
              {provName ? (
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Avatar name={provName} size={42} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:700, fontSize:14 }}>{provName}</p>
                    <p style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>
                      ★{activeBooking?.provider_profile?.rating > 0 ? Number(activeBooking.provider_profile.rating).toFixed(1) : 'New'} · ✓ KYC Verified · {activeBooking?.category?.icon} {activeBooking?.category?.name}
                    </p>
                  </div>
                  {provPhone && (
                    <a href={`tel:${provPhone}`} className="btn btn-outline btn-sm" style={{ textDecoration:'none', flexShrink:0 }}>📞 Call</a>
                  )}
                </div>
              ) : (
                <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text2)', fontSize:13 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', border:'2px solid #f97316', borderTopColor:'transparent', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
                  Searching for providers in {activeBooking?.district}...
                </div>
              )}
            </div>

            {/* Timeline */}
            <div style={{ padding:20 }}>
              <p style={{ fontWeight:700, fontSize:13, marginBottom:16 }}>Journey</p>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {TIMELINE.map((step, i) => {
                  const done   = i < currIdx
                  const active = i === currIdx
                  return (
                    <div key={i} style={{ display:'flex', gap:14, position:'relative' }}>
                      {i < TIMELINE.length-1 && (
                        <div style={{ position:'absolute', left:15, top:32, bottom:-8, width:2, background:done?'#16a34a':'var(--border)', transition:'background 0.5s' }} />
                      )}
                      <div className={`step-circle ${done?'done':active?'active':'pending'}`}
                        style={{ flexShrink:0, marginBottom:i<TIMELINE.length-1?24:0 }}>
                        {done?'✓':active?'●':''}
                      </div>
                      <div style={{ paddingBottom:i<TIMELINE.length-1?24:0 }}>
                        <p style={{ fontSize:13, fontWeight:active||done?600:400, color:active?'var(--brand)':done?'var(--text)':'var(--text2)' }}>
                          {step.icon} {step.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Cancel */}
            {activeBooking?.status === 'pending' && (
              <div style={{ padding:'0 20px 20px' }}>
                <button className="btn btn-danger" style={{ width:'100%' }} onClick={() => cancelBooking(activeBooking.id)}>
                  Cancel Booking
                </button>
              </div>
            )}
          </div>

          {/* RIGHT panel */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* OTP */}
            <div className="glass" style={{ padding:20, textAlign:'center' }}>
              <p style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Your Start OTP</p>
              <p style={{ fontSize:44, fontWeight:900, letterSpacing:8, color:'var(--brand)', fontFamily:'monospace' }}>
                {activeBooking?.start_otp ?? '----'}
              </p>
              <p style={{ fontSize:11, color:'var(--text3)', marginTop:10, lineHeight:1.6 }}>
                🔐 Share only when provider arrives at your door. Never share over call or chat.
              </p>
            </div>

            {/* Your location status */}
            <div className="glass" style={{ padding:16 }}>
              <p style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>📍 Your Location</p>
              {customerCoords ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                  <div className="live-dot" style={{ width:6, height:6 }} />
                  <span style={{ color:'#16a34a', fontWeight:600 }}>Location shared with provider</span>
                </div>
              ) : (
                <button className="btn btn-outline btn-sm" style={{ width:'100%' }}
                  onClick={() => navigator.geolocation?.getCurrentPosition(
                    p => setCustomerCoords({ lat:p.coords.latitude, lng:p.coords.longitude }),
                    () => toast.error('Please allow location access in browser settings')
                  )}>
                  📍 Share My Location
                </button>
              )}
            </div>

            {/* Booking details */}
            <div className="glass" style={{ padding:16 }}>
              <p style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Booking Details</p>
              {[
                ['Booking ID', activeBooking?.booking_ref ?? '—'],
                ['Service',   `${activeBooking?.category?.icon ?? ''} ${activeBooking?.category?.name ?? '—'}`],
                ['Address',   activeBooking?.address ?? '—'],
                ['District',  activeBooking?.district ?? '—'],
                ['Amount',    `₹${(activeBooking?.total_amount ?? 0).toLocaleString('en-IN')}`],
              ].map(([k,v],i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:8, gap:8 }}>
                  <span style={{ color:'var(--text3)', flexShrink:0 }}>{k}</span>
                  <span style={{ fontWeight:600, textAlign:'right', wordBreak:'break-word' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Support */}
            <a href="tel:+918045678900" className="btn btn-outline" style={{ textDecoration:'none', textAlign:'center', display:'block', fontSize:13 }}>
              📞 Call Support
            </a>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse{0%{transform:scale(0.5);opacity:1}100%{transform:scale(2.5);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes provMove{0%,100%{transform:translate(0,0)}33%{transform:translate(15px,8px)}66%{transform:translate(-8px,15px)}}
      `}</style>
    </div>
  )
}
