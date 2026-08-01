import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const STATUS_CONFIG:Record<string,{color:string;bg:string;label:string;icon:string}> = {
  pending:  {color:'#d97706',bg:'rgba(217,119,6,0.1)',  label:'Finding Provider', icon:'🔍'},
  accepted: {color:'#f97316',bg:'rgba(249,115,22,0.1)', label:'On the Way',       icon:'🛵'},
  active:   {color:'#2563eb',bg:'rgba(37,99,235,0.1)',  label:'In Progress',      icon:'🔧'},
  completed:{color:'#16a34a',bg:'rgba(22,163,74,0.1)',  label:'Completed',        icon:'✅'},
}

export default function CustomerTrack() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [selected, setSelected] = useState<string|null>(null)
  const [loading,  setLoading]  = useState(true)
  const [eta,      setEta]      = useState(8)
  const [dist,     setDist]     = useState(1.4)
  const [myLoc,    setMyLoc]    = useState<{lat:number,lng:number}|null>(null)

  const load = useCallback(async () => {
    if (!profile?.id) return
    const { data } = await supabase
      .from('bookings')
      .select(`*, category:service_categories(name,icon),
        provider_profile:providers!bookings_provider_id_fkey(rating,
          profile:profiles(full_name,phone))`)
      .eq('customer_id', profile.id)
      .in('status', ['pending','accepted','active'])
      .order('created_at', { ascending: false })
    setBookings(data ?? [])
    if (data?.length && !selected) setSelected(data[0].id)
    setLoading(false)
  }, [profile?.id]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const b = bookings.find(x => x.id === selected)
    if (b?.status !== 'accepted') return
    const t = setInterval(() => { setEta(e => Math.max(1,e-1)); setDist(d => parseFloat(Math.max(0.1,d-0.1).toFixed(1))) }, 15000)
    return () => clearInterval(t)
  }, [selected, bookings])

  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`ctrack-${profile.id}`)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'bookings',filter:`customer_id=eq.${profile.id}`},
        (payload:any) => {
          const u = payload.new
          setBookings(prev => prev.map(b=>b.id===u.id?{...b,...u}:b).filter(b=>['pending','accepted','active'].includes(b.status)))
          if(u.status==='accepted'){toast.success('Provider is on the way! 🛵',{duration:4000});setEta(8);setDist(1.4)}
          if(u.status==='active') toast.success('Job started! 🔧')
          if(u.status==='completed'){toast.success('Done! Rate your experience 🎉');load();setTimeout(()=>nav('/dashboard/bookings'),2500)}
        })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [profile?.id, load]) // eslint-disable-line

  async function cancelBooking(id:string) {
    const {error} = await supabase.from('bookings').update({status:'cancelled',cancelled_at:new Date().toISOString()}).eq('id',id)
    if(error){toast.error('Failed to cancel');return}
    toast.success('Booking cancelled')
    setBookings(prev=>prev.filter(b=>b.id!==id))
  }

  const bk   = bookings.find(b=>b.id===selected) ?? bookings[0]
  const prov = bk?.provider_profile
  const name = prov?.profile?.full_name ?? null
  const phone= prov?.profile?.phone ?? null
  const sc   = STATUS_CONFIG[bk?.status ?? 'pending'] ?? STATUS_CONFIG.pending

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',flexDirection:'column',gap:16}}>
      <div style={{width:48,height:48,border:'4px solid var(--border)',borderTop:'4px solid #f97316',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'var(--text2)',fontSize:14}}>Loading...</p>
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

      {/* Top bar */}
      <div style={{background:`linear-gradient(135deg,${sc.color},${sc.color}cc)`,padding:'14px 20px 18px',color:'#fff',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:bookings.length>1?10:0}}>
          <button onClick={()=>nav('/dashboard')} style={{background:'rgba(255,255,255,0.2)',border:'none',borderRadius:8,padding:'6px 12px',color:'#fff',cursor:'pointer',fontSize:14,fontWeight:600}}>← Back</button>
          <span style={{fontWeight:700,fontSize:14}}>Live Tracking</span>
          <div style={{display:'flex',alignItems:'center',gap:5,background:'rgba(255,255,255,0.2)',borderRadius:20,padding:'4px 10px',fontSize:11,fontWeight:700}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:'#fff',animation:'blink 1.5s ease-in-out infinite'}}/>LIVE
          </div>
        </div>
        {bookings.length>1&&(
          <div style={{display:'flex',gap:6,overflowX:'auto'}}>
            {bookings.map(b=>(
              <button key={b.id} onClick={()=>setSelected(b.id)}
                style={{flexShrink:0,padding:'5px 12px',borderRadius:20,border:`2px solid ${selected===b.id?'#fff':'rgba(255,255,255,0.4)'}`,background:selected===b.id?'rgba(255,255,255,0.25)':'transparent',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600,whiteSpace:'nowrap'}}>
                {b.category?.icon} {b.category?.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{height:260,background:'#1a2744',position:'relative',overflow:'hidden',flexShrink:0}}>
        <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',backgroundSize:'36px 36px'}}/>
        <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.1}}>
          <line x1="0" y1="60%" x2="100%" y2="55%" stroke="#fff" strokeWidth="10"/>
          <line x1="35%" y1="0" x2="40%" y2="100%" stroke="#fff" strokeWidth="7"/>
          <line x1="68%" y1="0" x2="65%" y2="100%" stroke="#fff" strokeWidth="6"/>
        </svg>

        {bk?.status==='pending'?(
          <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',color:'#fff'}}>
            <div style={{position:'relative',width:90,height:90,marginBottom:14}}>
              {[0,1,2].map(i=><div key={i} style={{position:'absolute',inset:0,border:`2px solid rgba(249,115,22,${0.6-i*0.15})`,borderRadius:'50%',animation:`ripple ${1.5+i*0.5}s ease-out infinite`,animationDelay:`${i*0.5}s`}}/>)}
              <div style={{position:'absolute',inset:'20%',background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,boxShadow:'0 0 20px rgba(249,115,22,0.6)'}}>📍</div>
            </div>
            <p style={{fontWeight:700,fontSize:15}}>Finding provider...</p>
            <p style={{fontSize:12,opacity:0.6,marginTop:3}}>Booking #{bk.booking_ref}</p>
          </div>
        ):(
          <div style={{position:'absolute',inset:0}}>
            {/* Customer pin */}
            <div style={{position:'absolute',bottom:'26%',left:'54%',textAlign:'center',zIndex:3}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#2563eb',border:'3px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,boxShadow:'0 2px 12px rgba(37,99,235,0.6)',margin:'0 auto'}}>🏠</div>
              <div style={{background:'rgba(37,99,235,0.9)',color:'#fff',fontSize:9,padding:'2px 7px',borderRadius:10,marginTop:3,whiteSpace:'nowrap'}}>You</div>
            </div>
            {/* Provider pin */}
            {bk?.status==='accepted'&&(
              <>
                <div style={{position:'absolute',top:'18%',left:'24%',textAlign:'center',zIndex:3,animation:'rideMove 6s ease-in-out infinite'}}>
                  <div style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,#f97316,#ea580c)',border:'3px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,boxShadow:'0 2px 16px rgba(249,115,22,0.7)',margin:'0 auto'}}>🛵</div>
                  <div style={{background:'rgba(249,115,22,0.95)',color:'#fff',fontSize:9,padding:'2px 7px',borderRadius:10,marginTop:3,whiteSpace:'nowrap'}}>{name?.split(' ')[0]??'Provider'}</div>
                </div>
                <svg style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
                  <path d="M 28% 25% Q 43% 48% 56% 74%" fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="8,5" opacity="0.7"/>
                </svg>
                <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.72)',borderRadius:20,padding:'7px 18px',color:'#fff',textAlign:'center',zIndex:4,backdropFilter:'blur(8px)'}}>
                  <span style={{fontSize:22,fontWeight:900,color:'#f97316'}}>{eta}</span>
                  <span style={{fontSize:12,color:'rgba(255,255,255,0.7)',marginLeft:4}}>min · {dist} km</span>
                </div>
              </>
            )}
            {bk?.status==='active'&&(
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div style={{textAlign:'center',color:'#fff'}}>
                  <div style={{fontSize:52,marginBottom:10,animation:'pulse2 2s ease-in-out infinite'}}>🔧</div>
                  <div style={{background:'rgba(37,99,235,0.85)',borderRadius:20,padding:'8px 22px',backdropFilter:'blur(8px)'}}>
                    <p style={{fontWeight:800,fontSize:15}}>Job In Progress</p>
                  </div>
                </div>
              </div>
            )}
            {!myLoc&&(
              <button onClick={()=>navigator.geolocation?.getCurrentPosition(p=>{setMyLoc({lat:p.coords.latitude,lng:p.coords.longitude});toast.success('Location shared!')},()=>toast.error('Allow location access'))}
                style={{position:'absolute',bottom:14,left:'50%',transform:'translateX(-50%)',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.35)',color:'#fff',padding:'8px 18px',borderRadius:20,fontSize:12,fontWeight:600,cursor:'pointer',backdropFilter:'blur(8px)',zIndex:4}}>
                📍 Share location for tracking
              </button>
            )}
            {myLoc&&(
              <div style={{position:'absolute',bottom:14,right:14,background:'rgba(22,163,74,0.85)',borderRadius:20,padding:'5px 12px',color:'#fff',fontSize:11,fontWeight:600}}>✓ Location shared</div>
            )}
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      <div style={{flex:1,background:'var(--card)',borderRadius:'20px 20px 0 0',marginTop:-14,position:'relative',zIndex:10,boxShadow:'0 -4px 24px rgba(0,0,0,0.1)'}}>
        <div style={{width:40,height:4,borderRadius:2,background:'var(--border)',margin:'10px auto 0'}}/>
        <div style={{padding:'14px 20px',maxHeight:'calc(100vh - 380px)',overflowY:'auto'}}>

          {/* Status + OTP */}
          <div style={{display:'flex',gap:12,marginBottom:18}}>
            <div style={{flex:1,background:sc.bg,border:`1.5px solid ${sc.color}33`,borderRadius:14,padding:'14px 16px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                <span style={{fontSize:20}}>{sc.icon}</span>
                <span style={{fontWeight:800,fontSize:15,color:sc.color}}>{sc.label}</span>
              </div>
              <p style={{fontSize:12,color:'var(--text2)'}}>
                {bk?.status==='pending'?'Connecting you with a verified provider...':
                 bk?.status==='accepted'?`${name??'Provider'} is ${eta} min away · ${dist} km`:
                 bk?.status==='active'?'Provider is working at your location':'Job complete!'}
              </p>
            </div>
            <div style={{background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:14,padding:'12px 14px',textAlign:'center',minWidth:100}}>
              <p style={{fontSize:9,color:'var(--text3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:6}}>OTP</p>
              <p style={{fontSize:28,fontWeight:900,letterSpacing:6,color:'var(--brand)',fontFamily:'monospace'}}>{bk?.start_otp??'----'}</p>
              <p style={{fontSize:9,color:'var(--text3)',marginTop:4}}>Share on arrival</p>
            </div>
          </div>

          {/* Provider card */}
          {name&&(
            <div style={{background:'var(--bg2)',borderRadius:16,padding:16,marginBottom:16,border:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <Avatar name={name} size={50} color="#f97316"/>
                <div style={{flex:1}}>
                  <p style={{fontWeight:800,fontSize:16}}>{name}</p>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginTop:3}}>
                    <span style={{fontSize:12,color:'#d97706',fontWeight:700}}>★{prov?.rating>0?Number(prov.rating).toFixed(1):'4.8'}</span>
                    <span style={{fontSize:12,color:'var(--text2)'}}>{bk?.category?.icon} {bk?.category?.name}</span>
                    <span style={{fontSize:11,color:'#16a34a',fontWeight:600}}>✓ Verified</span>
                  </div>
                </div>
                {phone&&(
                  <a href={`tel:${phone}`} style={{width:42,height:42,borderRadius:'50%',background:'rgba(249,115,22,0.1)',border:'1.5px solid rgba(249,115,22,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,textDecoration:'none',flexShrink:0}}>📞</a>
                )}
              </div>
            </div>
          )}

          {/* Progress steps */}
          <div style={{background:'var(--bg2)',borderRadius:16,padding:16,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',position:'relative'}}>
              <div style={{position:'absolute',top:17,left:'12%',right:'12%',height:3,background:'var(--border)',borderRadius:2}}>
                <div style={{height:'100%',borderRadius:2,background:'linear-gradient(90deg,#16a34a,#f97316)',transition:'width 0.5s ease',
                  width:bk?.status==='pending'?'0%':bk?.status==='accepted'?'33%':bk?.status==='active'?'66%':'100%'}}/>
              </div>
              {[{s:'pending',icon:'📋',label:'Booked'},{s:'accepted',icon:'🛵',label:'On Way'},{s:'active',icon:'🔧',label:'Working'},{s:'completed',icon:'✅',label:'Done'}].map((step,i)=>{
                const order=['pending','accepted','active','completed']
                const done=order.indexOf(step.s)<=order.indexOf(bk?.status??'pending')
                const act =order.indexOf(step.s)===order.indexOf(bk?.status??'pending')
                return(
                  <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,flex:1,position:'relative',zIndex:1}}>
                    <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,
                      background:done?(act?sc.color:'#16a34a'):'var(--bg)',
                      border:`2.5px solid ${done?(act?sc.color:'#16a34a'):'var(--border)'}`,
                      boxShadow:act?`0 0 0 4px ${sc.color}22`:'none',transition:'all 0.4s'}}>
                      {step.icon}
                    </div>
                    <p style={{fontSize:10,fontWeight:done?700:400,color:done?'var(--text)':'var(--text3)',textAlign:'center'}}>{step.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Booking details */}
          <div style={{background:'var(--bg2)',borderRadius:14,padding:14,marginBottom:16}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['ID',bk?.booking_ref??'—'],['Service',`${bk?.category?.icon??''} ${bk?.category?.name??'—'}`],['Address',bk?.address??'—'],['Amount',`₹${(bk?.total_amount??0).toLocaleString('en-IN')}`]].map(([k,v],i)=>(
                <div key={i}>
                  <p style={{fontSize:10,color:'var(--text3)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.3px'}}>{k}</p>
                  <p style={{fontSize:12,fontWeight:600,wordBreak:'break-word'}}>{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{display:'flex',gap:10,paddingBottom:20}}>
            {bk?.status==='pending'&&(
              <button className="btn btn-danger" style={{flex:1,padding:'13px',borderRadius:12,fontWeight:700}} onClick={()=>cancelBooking(bk.id)}>Cancel Booking</button>
            )}
            <a href="tel:+918045678900" className="btn btn-outline" style={{flex:1,padding:'13px',borderRadius:12,fontWeight:700,textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>📞 Support</a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ripple{0%{transform:scale(0.5);opacity:1}100%{transform:scale(2.8);opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.2}}
        @keyframes rideMove{0%,100%{transform:translate(0,0)}33%{transform:translate(25px,10px)}66%{transform:translate(10px,22px)}}
        @keyframes pulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
      `}</style>
    </div>
  )
}
