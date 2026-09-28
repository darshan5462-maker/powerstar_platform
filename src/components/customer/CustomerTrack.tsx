import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import LiveMap from '@/components/ui/LiveMap'
import toast from 'react-hot-toast'

interface Coords { lat: number; lng: number }

const SC: Record<string,{color:string;bg:string;label:string;icon:string}> = {
  pending_admin:     {color:'#d97706',bg:'rgba(217,119,6,0.1)',  label:'Waiting for Assignment', icon:'⏳'},
  provider_assigned: {color:'#3b82f6',bg:'rgba(59,130,246,0.1)', label:'Provider Assigned',    icon:'👤'},
  payment_pending:   {color:'#f97316',bg:'rgba(249,115,22,0.1)', label:'Payment Pending',      icon:'💳'},
  payment_success:   {color:'#16a34a',bg:'rgba(22,163,74,0.1)',  label:'Payment Success',      icon:'✅'},
  confirmed:         {color:'#16a34a',bg:'rgba(22,163,74,0.1)',  label:'Booking Confirmed',    icon:'✅'},
  in_progress:       {color:'#2563eb',bg:'rgba(37,99,235,0.1)',  label:'In Progress',          icon:'🔧'},
  completed:         {color:'#16a34a',bg:'rgba(22,163,74,0.1)',  label:'Completed',            icon:'⭐'},
}

export default function CustomerTrack() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings,      setBookings]      = useState<any[]>([])
  const [selected,      setSelected]      = useState<string|null>(null)
  const [loading,       setLoading]       = useState(true)
  const [provCoords,    setProvCoords]    = useState<Coords|null>(null)
  const [custCoords,    setCustCoords]    = useState<Coords|null>(null)
  const [locGranted,    setLocGranted]    = useState(false)
  const [isPaying,      setIsPaying]      = useState(false)

  const activeStatuses = ['pending_admin','provider_assigned','payment_pending','payment_success','confirmed','in_progress']

  const load = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('bookings')
      .select(`*, category:service_categories(name,icon),
        provider_profile:providers!bookings_provider_id_fkey(rating,
          profile:profiles(full_name,phone))`)
      .eq('customer_id', profile.id)
      .in('status', activeStatuses)
      .order('created_at', { ascending:false })
    setBookings(data ?? [])
    if (data?.length && !selected) setSelected(data[0].id)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  // Get customer location
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCustCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocGranted(true)
      },
      () => setLocGranted(false),
      { enableHighAccuracy: true }
    )
  }, [])

  // Realtime booking status
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`ctrack-${profile.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings',
        filter:`customer_id=eq.${profile.id}` },
        (payload: any) => {
          const u = payload.new
          setBookings(prev => prev.map(b => b.id===u.id?{...b,...u}:b).filter(b=>activeStatuses.includes(b.status)))
          if (u.status==='provider_assigned') toast.success('Provider Assigned!', {duration:5000})
          if (u.status==='payment_pending')   toast.success('Payment required to confirm booking')
          if (u.status==='confirmed')         toast.success('Booking confirmed! Provider is on the way. 🛵')
          if (u.status==='in_progress')       toast.success('Job has started! 🔧')
          if (u.status==='completed') {
            toast.success('🎉 Job done! Please rate your experience.')
            load()
            setTimeout(() => nav('/dashboard/bookings'), 2500)
          }
        }
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile?.id, load])

  async function handleUpiPayment(bk: any) {
    setIsPaying(true)
    
    // Simulate payment flow
    setTimeout(async () => {
      try {
        const { error: pErr } = await supabase.from('payments').insert({
          booking_id: bk.id,
          customer_id: profile?.id,
          provider_id: bk.provider_id,
          amount: bk.total_amount,
          method: 'upi',
          status: 'success'
        })
        if (pErr) throw pErr

        const { error: bErr } = await supabase.from('bookings')
          .update({ status: 'payment_success' })
          .eq('id', bk.id)
        if (bErr) throw bErr
        
        toast.success('UPI Payment successful!')
        
        // Immediately transition to confirmed based on backend hook, or simulate it here:
        await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bk.id)

      } catch (err: any) {
        toast.error('Payment failed: ' + err.message)
      } finally {
        setIsPaying(false)
        load()
      }
    }, 2000)
  }

  const bk    = bookings.find(b => b.id===selected) ?? bookings[0]
  const prov  = bk?.provider_profile
  const name  = prov?.profile?.full_name ?? null
  const phone = prov?.profile?.phone     ?? null
  const sc    = SC[bk?.status ?? 'pending_admin'] ?? SC.pending_admin

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:16}}>
      <div style={{width:44,height:44,border:'4px solid var(--border)',borderTop:'4px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'var(--text2)',fontSize:14}}>Loading your booking...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!bk) return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{textAlign:'center',maxWidth:340}}>
        <div style={{fontSize:64,marginBottom:16}}>📍</div>
        <h2 style={{fontWeight:800,fontSize:22,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:8}}>No Active Bookings</h2>
        <p style={{color:'var(--text2)',fontSize:14,marginBottom:24,lineHeight:1.6}}>Book a service to track your provider in real-time here.</p>
        <button className="btn btn-brand" style={{width:'100%',padding:'14px',fontSize:15}} onClick={()=>nav('/dashboard/book')}>+ Book a Service</button>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column'}}>
      {/* Status bar */}
      <div style={{background:`linear-gradient(135deg,${sc.color},${sc.color}cc)`,padding:'14px 20px 18px',color:'#fff',position:'sticky',top:0,zIndex:50,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:bookings.length>1?10:0}}>
          <button onClick={()=>nav('/dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,padding:'6px 14px',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600}}>← Back</button>
          <div style={{textAlign:'center'}}>
            <p style={{fontWeight:800,fontSize:15}}>{sc.icon} {sc.label}</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 12px',fontSize:11,fontWeight:700}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#fff',animation:'blink 1.5s ease-in-out infinite'}}/>LIVE
          </div>
        </div>
      </div>

      <LiveMap
        providerCoords={provCoords}
        customerCoords={custCoords}
        providerName={name ?? 'Provider'}
        customerName="You"
        status={bk?.status}
        height={220}
      />

      {/* Bottom sheet */}
      <div style={{flex:1,background:'var(--card)',borderTopLeftRadius:22,borderTopRightRadius:22,marginTop:-10,position:'relative',zIndex:10,boxShadow:'0 -4px 24px rgba(0,0,0,0.1)'}}>
        <div style={{width:40,height:4,borderRadius:2,background:'var(--border)',margin:'10px auto 0'}}/>
        <div style={{padding:'14px 18px',overflowY:'auto',maxHeight:'calc(100vh - 340px)'}}>

          {/* Status Message */}
          <div style={{display:'flex',gap:12,marginBottom:16}}>
            <div style={{flex:1,background:sc.bg,border:`1.5px solid ${sc.color}33`,borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <span style={{fontSize:20}}>{sc.icon}</span>
                <span style={{fontWeight:800,fontSize:15,color:sc.color}}>{sc.label}</span>
              </div>
              <p style={{fontSize:12,color:'var(--text2)',lineHeight:1.5}}>
                {bk?.status==='pending_admin' && 'Waiting for provider assignment by admin.'}
                {bk?.status==='provider_assigned' && 'A provider has been assigned! Waiting for provider acceptance.'}
                {bk?.status==='payment_pending' && 'Provider accepted. Please complete the UPI payment to confirm the booking.'}
                {bk?.status==='payment_success' && 'Payment successful! Confirming...'}
                {bk?.status==='confirmed' && 'Booking confirmed! Provider will arrive shortly.'}
                {bk?.status==='in_progress' && 'Provider is working at your location. Share OTP to complete.'}
              </p>
            </div>
          </div>

          {/* Payment Section */}
          {bk?.status === 'payment_pending' && (
            <div style={{background:'var(--bg2)',borderRadius:16,padding:16,marginBottom:14,border:'2px solid var(--brand)'}}>
              <p style={{fontWeight:800,fontSize:16,marginBottom:10,color:'var(--brand)'}}>Complete Payment</p>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <span style={{color:'var(--text2)',fontSize:14}}>Amount to Pay</span>
                <span style={{fontWeight:800,fontSize:18}}>₹{(bk?.total_amount??0).toLocaleString('en-IN')}</span>
              </div>
              
              <div style={{marginBottom:16}}>
                <p style={{fontWeight:600, fontSize:13, marginBottom:10}}>PAYMENT METHOD</p>
                <div style={{display:'grid', gridTemplateColumns:'1fr'}}>
                  <button style={{padding:'12px', borderRadius:10, border:`2px solid var(--brand)`, background:'var(--brand-light)', display:'flex', alignItems:'center', gap:10}}>
                    <div style={{fontSize:24}}>📱</div>
                    <div style={{fontSize:14, fontWeight:700, color:'var(--brand)'}}>UPI</div>
                    <div style={{marginLeft:'auto', fontSize:18, color:'var(--brand)'}}>✓</div>
                  </button>
                </div>
              </div>

              <button className="btn btn-brand" style={{width:'100%',padding:'14px',fontSize:15}} disabled={isPaying} onClick={() => handleUpiPayment(bk)}>
                {isPaying ? 'Processing UPI Payment...' : 'Pay via UPI'}
              </button>
            </div>
          )}

          {/* OTP Section */}
          {['confirmed','in_progress'].includes(bk?.status) && (
            <div style={{display:'flex',justifyContent:'center',marginBottom:16}}>
               <div style={{background:'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(234,88,12,0.04))',border:'2px solid rgba(249,115,22,0.25)',borderRadius:14,padding:'12px 14px',textAlign:'center',minWidth:140}}>
                <p style={{fontSize:10,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>OTP</p>
                <p style={{fontSize:28,fontWeight:900,letterSpacing:6,color:'var(--brand)',fontFamily:'monospace'}}>{bk?.status==='confirmed'?bk?.start_otp:bk?.end_otp}</p>
                <p style={{fontSize:10,color:'var(--text3)',marginTop:4,lineHeight:1.3}}>{bk?.status==='confirmed'?'Start OTP':'Completion OTP'}</p>
              </div>
            </div>
          )}

          {/* Provider card */}
          {name && (
            <div style={{background:'var(--bg2)',borderRadius:16,padding:16,marginBottom:14,border:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <Avatar name={name} size={50} color="#f97316"/>
                <div style={{flex:1}}>
                  <p style={{fontWeight:800,fontSize:16}}>{name}</p>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4,flexWrap:'wrap'}}>
                    <span style={{fontSize:12,color:'#d97706',fontWeight:700}}>★{prov?.rating>0?Number(prov.rating).toFixed(1):'New'}</span>
                    <span style={{fontSize:12,color:'var(--text2)'}}>{bk?.category?.icon} {bk?.category?.name}</span>
                    <span className="badge badge-green" style={{fontSize:10}}>✓ Verified</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Booking summary */}
          <div style={{background:'var(--bg2)',borderRadius:14,padding:14,marginBottom:14,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[
              ['Booking', bk?.booking_ref??'—'],
              ['Service', `${bk?.category?.icon??''} ${bk?.category?.name??'—'}`],
              ['Address', bk?.address??'—'],
              ['Amount',  `₹${(bk?.total_amount??0).toLocaleString('en-IN')}`],
            ].map(([k,v],i)=>(
              <div key={i}>
                <p style={{fontSize:10,color:'var(--text3)',marginBottom:2,textTransform:'uppercase',letterSpacing:'0.3px'}}>{k}</p>
                <p style={{fontSize:12,fontWeight:600,wordBreak:'break-word'}}>{v}</p>
              </div>
            ))}
          </div>

          <div style={{display:'flex',gap:10,paddingBottom:20}}>
            <a href="tel:+918045678900" className="btn btn-outline" style={{flex:1,padding:'13px',borderRadius:12,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              📞 Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
