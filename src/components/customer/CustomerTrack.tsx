import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const TIMELINE = [
  { status:'pending',   label:'Booking confirmed — finding provider' },
  { status:'accepted',  label:'Provider accepted — heading to you' },
  { status:'active',    label:'Job in progress' },
  { status:'completed', label:'Job complete — payment released' },
]

export default function CustomerTrack() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<string|null>(null)

  async function load() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('bookings')
      .select(`
        *, 
        category:service_categories(name, icon),
        customer:profiles!bookings_customer_id_fkey(full_name),
        provider_profile:providers!bookings_provider_id_fkey(
          hourly_rate, rating,
          profile:profiles(full_name, phone, district)
        )
      `)
      .eq('customer_id', profile.id)
      .in('status', ['pending','accepted','active'])
      .order('created_at', { ascending: false })
    setBookings(data ?? [])
    if (data && data.length > 0 && !selected) setSelected(data[0].id)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile?.id]) // eslint-disable-line

  // Realtime — update when booking changes
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`customer-track-${profile.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings',
        filter:`customer_id=eq.${profile.id}` },
        (payload:any) => {
          const updated = payload.new
          setBookings(prev => prev.map(b => b.id===updated.id ? {...b,...updated} : b)
            .filter(b => ['pending','accepted','active'].includes(b.status)))
          if (updated.status==='accepted') toast.success('✅ Provider accepted your booking!')
          if (updated.status==='active')   toast.success('🔧 Job has started!')
          if (updated.status==='completed') {
            toast.success('🎉 Job completed! Please rate your experience.')
            nav('/dashboard/bookings')
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile?.id]) // eslint-disable-line

  async function cancelBooking(id: string) {
    const { error } = await supabase.from('bookings')
      .update({ status:'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', id)
    if (error) { toast.error('Failed to cancel'); return }
    toast.success('Booking cancelled')
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  const activeBooking = bookings.find(b => b.id === selected) ?? bookings[0]

  if (loading) return (
    <div>
      <PageHeader title="Live Tracking" />
      <div className="page-content" style={{ textAlign:'center', paddingTop:48, color:'var(--text3)' }}>Loading...</div>
    </div>
  )

  if (bookings.length === 0) return (
    <div>
      <PageHeader title="Live Tracking" subtitle="Track your active bookings" />
      <div className="page-content">
        <div className="glass" style={{ padding:48, textAlign:'center', maxWidth:480 }}>
          <p style={{ fontSize:48, marginBottom:14 }}>📍</p>
          <p style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>No active bookings</p>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom:20 }}>
            When you book a service, track your provider in real-time here.
          </p>
          <button className="btn btn-brand" onClick={() => nav('/dashboard/book')}>Book a Service</button>
        </div>
      </div>
    </div>
  )

  const stepOrder = ['pending','accepted','active','completed']
  const currIdx   = stepOrder.indexOf(activeBooking?.status ?? 'pending')
  const provName  = activeBooking?.provider_profile?.profile?.full_name ?? null

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        subtitle={`Booking ${activeBooking?.booking_ref ?? ''}`}
        action={<StatusBadge status={activeBooking?.status ?? 'pending'} />}
      />
      <div className="page-content">

        {/* Multiple active bookings selector */}
        {bookings.length > 1 && (
          <div style={{ display:'flex', gap:8, marginBottom:18, overflowX:'auto' }}>
            {bookings.map(b => (
              <button key={b.id} onClick={() => setSelected(b.id)}
                style={{ padding:'8px 14px', borderRadius:10, border:`2px solid ${selected===b.id?'var(--brand)':'var(--border)'}`, background:selected===b.id?'var(--brand-light)':'var(--bg2)', cursor:'pointer', whiteSpace:'nowrap', fontSize:13, fontWeight:600, color:selected===b.id?'var(--brand)':'var(--text)' }}>
                {b.category?.icon} {b.category?.name} · {b.booking_ref}
              </button>
            ))}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, maxWidth:900 }}>

          {/* Main tracking card */}
          <div className="glass" style={{ overflow:'hidden' }}>

            {/* Map area */}
            <div style={{ height:220, background:'linear-gradient(135deg,#0f2744,#1e3a5f)', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'40px 40px' }} />
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                <div style={{ textAlign:'center', color:'#fff' }}>
                  {activeBooking?.status === 'pending' ? (
                    <>
                      <div style={{ fontSize:40, marginBottom:10 }}>🔍</div>
                      <p style={{ fontWeight:700, fontSize:15 }}>Finding provider near you...</p>
                      <p style={{ fontSize:12, opacity:0.6, marginTop:4 }}>Usually within 2-3 minutes</p>
                    </>
                  ) : activeBooking?.status === 'accepted' ? (
                    <>
                      <div style={{ fontSize:40, marginBottom:10, animation:'float 3s ease-in-out infinite' }}>🛵</div>
                      <p style={{ fontWeight:700, fontSize:15 }}>Provider is on the way!</p>
                      <p style={{ fontSize:12, opacity:0.6, marginTop:4 }}>Live GPS · Updates every 30s</p>
                    </>
                  ) : activeBooking?.status === 'active' ? (
                    <>
                      <div style={{ fontSize:40, marginBottom:10 }}>🔧</div>
                      <p style={{ fontWeight:700, fontSize:15 }}>Job in progress</p>
                      <p style={{ fontSize:12, opacity:0.6, marginTop:4 }}>Provider is working at your location</p>
                    </>
                  ) : null}
                </div>
              </div>
              <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.5)', borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:6, color:'#fff', fontSize:12, zIndex:2 }}>
                <div className="live-dot" style={{ width:6, height:6 }} /> Live
              </div>
            </div>

            {/* Provider info — shows after acceptance */}
            {provName ? (
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
                <Avatar name={provName} size={44} />
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, fontSize:14 }}>{provName}</p>
                  <p style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>
                    ★{activeBooking?.provider_profile?.rating > 0 ? Number(activeBooking.provider_profile.rating).toFixed(1) : 'New'} · ✓ KYC Verified
                  </p>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  {activeBooking?.provider_profile?.profile?.phone && (
                    <a href={`tel:${activeBooking.provider_profile.profile.phone}`}
                      className="btn btn-outline btn-sm" style={{ textDecoration:'none' }}>📞 Call</a>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', color:'var(--text2)', fontSize:13 }}>
                ⏳ Waiting for a provider to accept...
              </div>
            )}

            {/* Timeline */}
            <div style={{ padding:20 }}>
              <p style={{ fontWeight:700, fontSize:13, marginBottom:16 }}>Booking Timeline</p>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {TIMELINE.map((step, i) => {
                  const done   = i < currIdx
                  const active = i === currIdx
                  return (
                    <div key={i} style={{ display:'flex', gap:14, position:'relative' }}>
                      {i < TIMELINE.length-1 && (
                        <div style={{ position:'absolute', left:15, top:32, bottom:-8, width:2, background:done?'#16a34a':'var(--border)' }} />
                      )}
                      <div className={`step-circle ${done?'done':active?'active':'pending'}`}
                        style={{ flexShrink:0, marginBottom:i<TIMELINE.length-1?24:0 }}>
                        {done?'✓':active?'●':''}
                      </div>
                      <div style={{ paddingBottom:i<TIMELINE.length-1?24:0 }}>
                        <p style={{ fontSize:13, fontWeight:active||done?600:400, color:active||done?'var(--text)':'var(--text2)' }}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, padding:'14px 20px', borderTop:'1px solid var(--border)' }}>
              {activeBooking?.status === 'pending' && (
                <button className="btn btn-danger" style={{ flex:1 }} onClick={() => cancelBooking(activeBooking.id)}>
                  Cancel Booking
                </button>
              )}
              {activeBooking?.status === 'completed' && (
                <button className="btn btn-brand" style={{ flex:1 }} onClick={() => nav('/dashboard/bookings')}>
                  ⭐ Rate & Review
                </button>
              )}
            </div>
          </div>

          {/* Side panel — booking details + OTP */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* OTP card */}
            <div className="glass" style={{ padding:20, textAlign:'center' }}>
              <p style={{ fontSize:12, color:'var(--text2)', marginBottom:8 }}>Your Start OTP</p>
              <p style={{ fontSize:36, fontWeight:900, letterSpacing:8, color:'var(--brand)', fontFamily:'monospace' }}>
                {activeBooking?.start_otp ?? '----'}
              </p>
              <p style={{ fontSize:11, color:'var(--text3)', marginTop:8, lineHeight:1.5 }}>
                Share this OTP with the provider only when they arrive. Do NOT share over phone/chat.
              </p>
            </div>

            {/* Booking details */}
            <div className="glass" style={{ padding:20 }}>
              <p style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>Booking Details</p>
              {[
                ['Service',  `${activeBooking?.category?.icon ?? ''} ${activeBooking?.category?.name ?? '—'}`],
                ['Address',  activeBooking?.address ?? '—'],
                ['District', activeBooking?.district ?? '—'],
                ['Amount',   `₹${(activeBooking?.total_amount ?? 0).toLocaleString('en-IN')}`],
              ].map(([k,v], i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10, fontSize:13 }}>
                  <span style={{ color:'var(--text3)', flexShrink:0, marginRight:8 }}>{k}</span>
                  <span style={{ fontWeight:600, textAlign:'right' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Support */}
            <div className="glass" style={{ padding:16, textAlign:'center' }}>
              <p style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>Need help?</p>
              <a href="tel:+918045678900" className="btn btn-outline" style={{ width:'100%', display:'block', textDecoration:'none', textAlign:'center' }}>
                📞 Call Support
              </a>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  )
}
