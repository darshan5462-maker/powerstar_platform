import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import LiveMap from '@/components/ui/LiveMap'
import toast from 'react-hot-toast'

interface Coords { lat: number; lng: number }

const SC: Record<string,{color:string;bg:string;label:string;icon:string}> = {
  pending:  {color:'#d97706',bg:'rgba(217,119,6,0.1)',  label:'Finding Provider', icon:'🔍'},
  accepted: {color:'#f97316',bg:'rgba(249,115,22,0.1)', label:'On the Way',       icon:'🛵'},
  active:   {color:'#2563eb',bg:'rgba(37,99,235,0.1)',  label:'In Progress',      icon:'🔧'},
  completed:{color:'#16a34a',bg:'rgba(22,163,74,0.1)',  label:'Completed',        icon:'✅'},
}

function calcDist(a: Coords, b: Coords) {
  const R=6371, dLat=(b.lat-a.lat)*Math.PI/180, dLon=(b.lng-a.lng)*Math.PI/180
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2
  return (R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)))
}

export default function CustomerTrack() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings,      setBookings]      = useState<any[]>([])
  const [selected,      setSelected]      = useState<string|null>(null)
  const [loading,       setLoading]       = useState(true)
  const [loadError,     setLoadError]     = useState<string | null>(null)
  const [provCoords,    setProvCoords]    = useState<Coords|null>(null)
  const [custCoords,    setCustCoords]    = useState<Coords|null>(null)
  const [locGranted,    setLocGranted]    = useState(false)
  const [locError,      setLocError]      = useState<string | null>(null)
  const [shareError,    setShareError]    = useState<string | null>(null)
  const [eta,           setEta]           = useState<number|null>(null)
  const [distKm,        setDistKm]        = useState<number|null>(null)

  const load = useCallback(async () => {
    if (!profile?.id) return
    setLoadError(null)
    const { data, error } = await supabase
      .from('bookings')
      .select(`*, category:service_categories(name,icon),
        provider_profile:providers!bookings_provider_id_fkey(rating,
          profile:profiles(full_name,phone))`)
      .eq('customer_id', profile.id)
      .in('status', ['pending','accepted','active'])
      .order('created_at', { ascending:false })
    if (error) {
      setLoadError('Your active bookings could not be loaded.')
      setBookings([])
    } else {
      setBookings(data ?? [])
    }
    if (data?.length && !selected) setSelected(data[0].id)
    setLoading(false)
  }, [profile?.id]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocError('This browser does not support location access.')
      setLocGranted(false)
      return
    }
    setLocError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setCustCoords(coords)
        setLocGranted(true)
        setLocError(null)
      },
      error => {
        setLocGranted(false)
        setLocError(error.code === 1 ? 'Location permission was denied. Enable Location for this site in browser settings, then tap Allow again.' : 'Location could not be detected. Check your phone GPS and try again.')
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
  }, [])

  // Ask once on entry; the visible Allow button calls the same action again
  // after a user changes browser permission settings.
  useEffect(() => { requestLocation() }, [requestLocation])

  useEffect(() => {
    if (!locGranted || !navigator.geolocation) return
    const watch = navigator.geolocation.watchPosition(
      pos => setCustCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocError('Live location updates stopped. Tap Allow to retry.'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )
    return () => navigator.geolocation.clearWatch(watch)
  }, [locGranted])

  // Subscribe to provider location
  useEffect(() => {
    const bk = bookings.find(b => b.id === selected)
    if (!bk?.provider_id) return

    // Get initial location
    supabase.from('provider_locations').select('latitude,longitude')
      .eq('provider_id', bk.provider_id).maybeSingle()
      .then(({ data }) => { if (data) setProvCoords({ lat: data.latitude, lng: data.longitude }) })

    // Realtime updates
    const ch = supabase.channel(`ploc-${bk.provider_id}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'provider_locations',
        filter:`provider_id=eq.${bk.provider_id}` },
        (payload: any) => {
          const { latitude: lat, longitude: lng } = payload.new ?? {}
          if (Number.isFinite(lat) && Number.isFinite(lng)) setProvCoords({ lat, lng })
        }
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [selected, bookings])

  // Calculate distance & ETA when coords update
  useEffect(() => {
    if (!provCoords || !custCoords) return
    const d = calcDist(provCoords, custCoords)
    setDistKm(d)
    setEta(Math.max(1, Math.round(d * 3))) // ~20km/h average city speed
  }, [provCoords, custCoords])

  // Save customer location to DB for provider navigation.
  useEffect(() => {
    const bk = bookings.find(b => b.id === selected)
    if (!bk?.id || !custCoords || !profile?.id) return
    supabase.from('customer_locations').upsert({
      booking_id:  bk.id,
      customer_id: profile.id,
      latitude:    custCoords.lat,
      longitude:   custCoords.lng,
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'booking_id' }).then(({ error }) => {
      if (error) setShareError('Location permission is on, but sharing is unavailable. Apply the customer_locations migration, then retry.')
      else setShareError(null)
    })
  }, [custCoords, selected, bookings, profile?.id])

  // Realtime booking status
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`ctrack-${profile.id}`)
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings',
        filter:`customer_id=eq.${profile.id}` },
        (payload: any) => {
          const u = payload.new
          setBookings(prev => prev.map(b => b.id===u.id?{...b,...u}:b).filter(b=>['pending','accepted','active'].includes(b.status)))
          if (u.status==='accepted') toast.success('Provider is on the way! 🛵', {duration:5000})
          if (u.status==='active')   toast.success('Job has started! 🔧')
          if (u.status==='completed') {
            toast.success('🎉 Job done! Please rate your experience.')
            load()
            setTimeout(() => nav('/dashboard/bookings'), 2500)
          }
        }
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile?.id, load]) // eslint-disable-line

  async function cancelBooking(id: string) {
    if (!profile?.id || !window.confirm('Cancel this pending booking?')) return
    const { error } = await supabase.from('bookings')
      .update({ status:'cancelled', cancelled_at:new Date().toISOString(), cancellation_reason:'Cancelled by customer' })
      .eq('id', id).eq('customer_id', profile.id).eq('status', 'pending')
    if (error) { toast.error(error.message || 'Failed to cancel'); return }
    toast.success('Booking cancelled')
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  const bk    = bookings.find(b => b.id===selected) ?? bookings[0]
  const prov  = bk?.provider_profile
  const name  = prov?.profile?.full_name ?? null
  const phone = prov?.profile?.phone     ?? null
  const sc    = SC[bk?.status ?? 'pending'] ?? SC.pending

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:16}}>
      <div style={{width:44,height:44,border:'4px solid var(--border)',borderTop:'4px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'var(--text2)',fontSize:14}}>Loading your booking...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (loadError) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div className="glass" role="alert" style={{ textAlign:'center', maxWidth:360, padding:28 }}>
        <p style={{ fontSize:40, marginBottom:12 }}>⚠️</p>
        <h2 style={{ fontWeight:800, fontSize:20, marginBottom:8 }}>Tracking unavailable</h2>
        <p style={{ color:'var(--text2)', fontSize:13, lineHeight:1.6, marginBottom:18 }}>{loadError}</p>
        <button className="btn btn-outline" onClick={() => void load()}>Try again</button>
      </div>
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
            {eta && distKm && bk?.status==='accepted' && (
              <p style={{fontSize:12,opacity:0.85,marginTop:2}}>~{eta} min · {distKm.toFixed(1)} km away</p>
            )}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.2)',borderRadius:20,padding:'5px 12px',fontSize:11,fontWeight:700}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#fff',animation:'blink 1.5s ease-in-out infinite'}}/>LIVE
          </div>
        </div>
        {bookings.length > 1 && (
          <div style={{display:'flex',gap:6,overflowX:'auto',paddingTop:4}}>
            {bookings.map(b => (
              <button key={b.id} onClick={()=>setSelected(b.id)}
                style={{flexShrink:0,padding:'5px 12px',borderRadius:20,border:`2px solid ${selected===b.id?'#fff':'rgba(255,255,255,0.4)'}`,background:selected===b.id?'rgba(255,255,255,0.25)':'transparent',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>
                {b.category?.icon} {b.category?.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* REAL MAP */}
      <LiveMap
        providerCoords={provCoords}
        customerCoords={custCoords}
        providerName={name ?? 'Provider'}
        customerName="You"
        status={bk?.status}
        height={300}
      />

      {/* Location permission banner */}
      {!locGranted && (
        <div style={{background:'rgba(217,119,6,0.1)',border:'1px solid rgba(217,119,6,0.3)',padding:'10px 16px',display:'flex',alignItems:'center',gap:10,fontSize:13}}>
          <span style={{fontSize:18}}>📍</span>
          <div style={{flex:1}}>
            <p style={{fontWeight:700,color:'#d97706'}}>Enable location for better tracking</p>
            <p style={{fontSize:12,color:'var(--text2)',marginTop:1}}>Allow location access in your browser settings</p>
          </div>
          <button className="btn btn-sm" style={{background:'rgba(217,119,6,0.15)',color:'#d97706',border:'1px solid rgba(217,119,6,0.3)',flexShrink:0}}
            onClick={requestLocation}>
            Allow
          </button>
          </div>
        )}
        {(locError || shareError) && (
          <div role="alert" style={{ background:'rgba(220,38,38,0.06)', borderBottom:'1px solid rgba(220,38,38,0.18)', padding:'9px 16px', color:'#b91c1c', fontSize:12, lineHeight:1.45 }}>
            {locError || shareError}
          </div>
        )}

      {/* Bottom sheet */}
      <div style={{flex:1,background:'var(--card)',borderTopLeftRadius:22,borderTopRightRadius:22,marginTop:-10,position:'relative',zIndex:10,boxShadow:'0 -4px 24px rgba(0,0,0,0.1)'}}>
        <div style={{width:40,height:4,borderRadius:2,background:'var(--border)',margin:'10px auto 0'}}/>
        <div style={{padding:'14px 18px',overflowY:'auto',maxHeight:'calc(100vh - 420px)'}}>

          {/* Status + OTP */}
          <div style={{display:'flex',gap:12,marginBottom:16}}>
            <div style={{flex:1,background:sc.bg,border:`1.5px solid ${sc.color}33`,borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <span style={{fontSize:20}}>{sc.icon}</span>
                <span style={{fontWeight:800,fontSize:15,color:sc.color}}>{sc.label}</span>
              </div>
              <p style={{fontSize:12,color:'var(--text2)',lineHeight:1.5}}>
                {bk?.status==='pending'?'Searching for a verified provider in your area...':
                 bk?.status==='accepted'?`${name??'Provider'} is ${eta??'?'} min away · ${distKm?.toFixed(1)??'?'} km`:
                 bk?.status==='active'?'Provider is working at your location. Share OTP to confirm.':'Job complete!'}
              </p>
            </div>
            <div style={{background:'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(234,88,12,0.04))',border:'2px solid rgba(249,115,22,0.25)',borderRadius:14,padding:'12px 14px',textAlign:'center',minWidth:104}}>
              <p style={{fontSize:9,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>Start OTP</p>
              <p style={{fontSize:28,fontWeight:900,letterSpacing:6,color:'var(--brand)',fontFamily:'monospace'}}>{bk?.start_otp??'----'}</p>
              <p style={{fontSize:9,color:'var(--text3)',marginTop:4,lineHeight:1.3}}>Share only on arrival</p>
            </div>
          </div>

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
                {phone && (
                  <a href={`tel:${phone}`} style={{width:44,height:44,borderRadius:'50%',background:'rgba(22,163,74,0.1)',border:'1.5px solid rgba(22,163,74,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,textDecoration:'none',flexShrink:0}}>📞</a>
                )}
              </div>
            </div>
          )}

          {/* Progress bar */}
          <div style={{background:'var(--bg2)',borderRadius:16,padding:'14px 16px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',position:'relative'}}>
              <div style={{position:'absolute',top:18,left:'10%',right:'10%',height:3,background:'var(--border)',borderRadius:2}}>
                <div style={{height:'100%',borderRadius:2,background:`linear-gradient(90deg,#16a34a,${sc.color})`,transition:'width 0.6s ease',
                  width:bk?.status==='pending'?'0%':bk?.status==='accepted'?'33%':bk?.status==='active'?'66%':'100%'}}/>
              </div>
              {[{s:'pending',icon:'📋',l:'Booked'},{s:'accepted',icon:'🛵',l:'On Way'},{s:'active',icon:'🔧',l:'Working'},{s:'completed',icon:'✅',l:'Done'}].map((step,i)=>{
                const order=['pending','accepted','active','completed']
                const done=order.indexOf(step.s)<=order.indexOf(bk?.status??'pending')
                const act =order.indexOf(step.s)===order.indexOf(bk?.status??'pending')
                return(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:7,flex:1,position:'relative',zIndex:1}}>
                    <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
                      background:done?(act?sc.color:'#16a34a'):'var(--bg)',
                      border:`2.5px solid ${done?(act?sc.color:'#16a34a'):'var(--border)'}`,
                      boxShadow:act?`0 0 0 4px ${sc.color}22`:'none',transition:'all 0.4s'}}>
                      {step.icon}
                    </div>
                    <p style={{fontSize:10,fontWeight:done?700:400,color:done?'var(--text)':'var(--text3)',textAlign:'center'}}>{step.l}</p>
                  </div>
                )
              })}
            </div>
          </div>

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

          {/* Location status */}
          <div style={{background:locGranted?'rgba(22,163,74,0.06)':'var(--bg2)',border:`1px solid ${locGranted?'rgba(22,163,74,0.2)':'var(--border)'}`,borderRadius:12,padding:'10px 14px',marginBottom:14,display:'flex',alignItems:'center',gap:10,fontSize:12}}>
            {locGranted ? (
              <><div className="live-dot" style={{width:7,height:7}}/><span style={{color:'#16a34a',fontWeight:600}}>Your live location shared with provider</span></>
            ) : (
              <><span style={{fontSize:16}}>📍</span><span style={{color:'var(--text2)'}}>Location not shared — provider cannot navigate to you</span></>
            )}
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:10,paddingBottom:20}}>
            {bk?.status==='pending' && (
              <button className="btn btn-danger" style={{flex:1,padding:'13px',borderRadius:12}} onClick={()=>cancelBooking(bk.id)}>Cancel Booking</button>
            )}
            <a href="tel:+918045678900" className="btn btn-outline" style={{flex:1,padding:'13px',borderRadius:12,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              📞 Support
            </a>
          </div>
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </div>
  )
}
