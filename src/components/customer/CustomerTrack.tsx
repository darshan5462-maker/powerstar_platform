import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getCustomerBookings, updateBookingStatus } from '@/services/bookingService'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

const TIMELINE_STEPS = [
  { key:'pending',   label:'Booking confirmed & payment secured' },
  { key:'accepted',  label:'Provider accepted your booking' },
  { key:'active',    label:'Provider en route / Job in progress' },
  { key:'completed', label:'Job complete · Payment released' },
]

export default function CustomerTrack() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [eta,      setEta]      = useState(12)
  const [dist,     setDist]     = useState(0.8)

  useEffect(() => {
    if (!profile?.id) return
    getCustomerBookings(profile.id).then(d => { setBookings(d); setLoading(false) })
  }, [profile?.id])

  useEffect(() => {
    const t = setInterval(() => {
      setEta(e  => Math.max(0, e - 1))
      setDist(d => parseFloat(Math.max(0, d - 0.06).toFixed(1)))
    }, 8000)
    return () => clearInterval(t)
  }, [])

  const active = bookings.find(b => b.status === 'active' || b.status === 'accepted' || b.status === 'pending')

  function getStepStatus(stepKey: string, bookingStatus: string) {
    const order = ['pending','accepted','active','completed']
    const stepIdx = order.indexOf(stepKey)
    const currIdx = order.indexOf(bookingStatus)
    if (stepIdx < currIdx)  return 'done'
    if (stepIdx === currIdx) return 'active'
    return 'pending'
  }

  if (loading) return (
    <div>
      <PageHeader title="Live Tracking" />
      <div className="page-content" style={{ textAlign:'center', paddingTop:48, color:'var(--text3)' }}>Loading...</div>
    </div>
  )

  if (!active) return (
    <div>
      <PageHeader title="Live Tracking" subtitle="Track your active bookings" />
      <div className="page-content">
        <div className="glass" style={{ padding:48, textAlign:'center', maxWidth:480 }}>
          <p style={{ fontSize:48, marginBottom:14 }}>📍</p>
          <p style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>No active bookings</p>
          <p style={{ color:'var(--text2)', fontSize:13, marginBottom:20 }}>
            When you book a service, you can track your provider in real-time here.
          </p>
          <button className="btn btn-brand" onClick={()=>nav('/dashboard/book')}>Book a Service</button>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        subtitle={`Booking ${active.booking_ref} · ${active.category?.name}`}
        action={<span className="badge badge-orange">🟠 {active.status === 'pending' ? 'Finding provider' : active.status === 'accepted' ? 'Provider en route' : 'Job in progress'}</span>}
      />
      <div className="page-content">
        <div className="glass" style={{ overflow:'hidden', maxWidth:700 }}>

          {/* Map */}
          <div style={{ height:240, background:'linear-gradient(135deg,#0f2744,#1e3a5f)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize:'40px 40px' }} />
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
              <div style={{ textAlign:'center', color:'#fff' }}>
                <div style={{ fontSize:48, marginBottom:8, animation:'float 3s ease-in-out infinite' }}>📍</div>
                <p style={{ fontWeight:700, fontSize:15 }}>
                  {active.status === 'pending' ? 'Finding nearest provider...' : 'Provider is on the way'}
                </p>
                <p style={{ fontSize:12, opacity:0.6, marginTop:4 }}>Live GPS · Updates every 30s</p>
                {active.status !== 'pending' && (
                  <div style={{ display:'flex', gap:24, justifyContent:'center', marginTop:16 }}>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:26, fontWeight:900, color:'#f97316' }}>{eta}</p>
                      <p style={{ fontSize:11, opacity:0.7 }}>min ETA</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:26, fontWeight:900, color:'#f97316' }}>{dist}</p>
                      <p style={{ fontSize:11, opacity:0.7 }}>km away</p>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:26, fontWeight:900, color:'#f97316' }}>{active.start_otp ?? '----'}</p>
                      <p style={{ fontSize:11, opacity:0.7 }}>OTP</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.5)', borderRadius:20, padding:'4px 12px', display:'flex', alignItems:'center', gap:6, color:'#fff', fontSize:12, zIndex:2 }}>
              <div className="live-dot" style={{ width:6, height:6 }} /> Live
            </div>
          </div>

          {/* Provider contact */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:'1px solid var(--border)' }}>
            <Avatar name="Suresh Kumar" size={44} />
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:14 }}>Suresh Kumar</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:1 }}>Plumber · ★ 4.9 · KYC Verified</p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn btn-outline btn-sm">📞 Call</button>
              <button className="btn btn-brand btn-sm">💬 Chat</button>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ padding:20 }}>
            <p style={{ fontWeight:700, fontSize:13, marginBottom:16 }}>Booking Timeline</p>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {TIMELINE_STEPS.map((step, i) => {
                const status = getStepStatus(step.key, active.status)
                return (
                  <div key={i} style={{ display:'flex', gap:14, position:'relative' }}>
                    {i < TIMELINE_STEPS.length - 1 && (
                      <div style={{ position:'absolute', left:15, top:32, bottom:-8, width:2, background:status==='done'?'#16a34a':'var(--border)' }} />
                    )}
                    <div className={`step-circle ${status}`} style={{ flexShrink:0, marginBottom:i<TIMELINE_STEPS.length-1?24:0 }}>
                      {status==='done'?'✓':status==='active'?'●':''}
                    </div>
                    <div style={{ paddingBottom:i<TIMELINE_STEPS.length-1?24:0 }}>
                      <p style={{ fontSize:13, fontWeight:status==='pending'?400:600, color:status==='pending'?'var(--text2)':'var(--text)' }}>
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
            <button className="btn btn-outline" style={{ flex:1 }}
              onClick={async () => {
                await updateBookingStatus(active.id, 'cancelled')
                setBookings(prev => prev.map(b => b.id===active.id ? {...b,status:'cancelled'} : b))
                toast.success('Booking cancelled')
              }}>
              Cancel Booking
            </button>
            <button className="btn btn-success" style={{ flex:2 }}
              onClick={async () => {
                await updateBookingStatus(active.id, 'completed')
                setBookings(prev => prev.map(b => b.id===active.id ? {...b,status:'completed'} : b))
                toast.success('Job marked complete! Leave a review ⭐')
              }}>
              Mark Complete & Rate
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}`}</style>
    </div>
  )
}
