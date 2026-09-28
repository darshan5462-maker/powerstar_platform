import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import { MANPOWER, VEHICLES, calcPrice } from '@/data/services'
import { DISTRICTS, getCities } from '@/data/karnataka'
import toast from 'react-hot-toast'

export default function CustomerBook() {
  const { profile } = useAuthStore()
  const nav = useNavigate()

  const [step,      setStep]      = useState(1)
  const [svcType,   setSvcType]   = useState<'manpower'|'vehicle'>('manpower')
  const [svcIdx,    setSvcIdx]    = useState(0)
  
  const [district,  setDistrict]  = useState(profile?.district || DISTRICTS[0].name)
  const [city,      setCity]      = useState(profile?.city || '')
  const [address,   setAddress]   = useState('')
  const [notes,     setNotes]     = useState('')

  const [hours,        setHours]        = useState(2)
  const [loading,      setLoading]      = useState(false)

  const allSvcs     = svcType === 'manpower' ? MANPOWER : VEHICLES
  const svc         = allSvcs[svcIdx]
  const districtObj = DISTRICTS.find(d => d.name === district) || DISTRICTS[0]
  const cities      = getCities(districtObj.id)

  useEffect(() => { setCity('') }, [district])

  const rate  = svc.basePrice
  const price = svc.type === 'vehicle' ? calcPrice(svc.basePrice, 1) : calcPrice(rate, hours)

  function goToStep2() {
    if (!address.trim()) { toast.error('Enter your address'); return }
    setStep(2)
  }

  async function submitBookingRequest() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data: cat } = await supabase
        .from('service_categories').select('id').eq('slug', svc.id).maybeSingle()
      
      const { error } = await supabase.from('bookings').insert({
        customer_id:    profile.id,
        category_id:    cat?.id || '00000000-0000-0000-0000-000000000000',
        address, city: city || district, district,
        base_amount:    price.base,
        platform_fee:   price.fee,
        gst_amount:     price.gst,
        total_amount:   price.total,
        customer_notes: notes || null,
        status:         'pending_admin',
      })
      if (error) throw error
      toast.success('Booking request submitted! Waiting for provider assignment.')
      nav('/dashboard/bookings')
    } catch (err: any) {
      toast.error(err?.message || 'Booking request failed')
    } finally {
      setLoading(false)
    }
  }

  const STEPS = ['Service & Location', 'Review & Submit']

  return (
    <div>
      <PageHeader title="Book a Service" subtitle="Your service provider will be assigned by our team" />
      <div className="page-content">
        <div style={{ maxWidth:700 }}>

          {/* Step bar */}
          <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', flex:i<STEPS.length-1?1:'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <div className={`step-circle ${i+1<step?'done':i+1===step?'active':'pending'}`}>
                    {i+1<step?'✓':i+1}
                  </div>
                  <span style={{ fontSize:10, color:i+1===step?'var(--brand)':'var(--text3)', fontWeight:i+1===step?700:400, whiteSpace:'nowrap' }}>{s}</span>
                </div>
                {i<STEPS.length-1 && <div style={{ flex:1, height:2, background:i+1<step?'#16a34a':'var(--border)', margin:'0 8px', marginBottom:18 }} />}
              </div>
            ))}
          </div>

          <div className="glass" style={{ padding:28 }}>

            {/* ── STEP 1 ── */}
            {step===1 && (
              <div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>What do you need?</h3>
                <div className="tab-bar" style={{ marginBottom:16 }}>
                  <button className={`tab-item ${svcType==='manpower'?'active':''}`} onClick={()=>{setSvcType('manpower');setSvcIdx(0)}}>👷 Manpower</button>
                  <button className={`tab-item ${svcType==='vehicle'?'active':''}`}  onClick={()=>{setSvcType('vehicle');setSvcIdx(0)}}>🚛 Vehicles</button>
                </div>
                <div className="h-scroll" style={{ marginBottom:20 }}>
                  {allSvcs.slice(0,8).map((s,i)=>(
                    <div key={i} className="h-scroll-item" onClick={()=>setSvcIdx(i)}
                      style={{ width:100, padding:'12px 6px', border:`2px solid ${svcIdx===i?'var(--brand)':'var(--border)'}`, borderRadius:10, textAlign:'center', cursor:'pointer', background:svcIdx===i?'var(--brand-light)':'transparent', transition:'all 0.15s' }}>
                      <div style={{ fontSize:22, marginBottom:5 }}>{s.icon}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:svcIdx===i?'var(--brand)':'var(--text)', lineHeight:1.2 }}>{s.name}</div>
                      {s.basePrice>0 && <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>₹{s.basePrice}{s.unit}</div>}
                    </div>
                  ))}
                </div>

                {svcType==='manpower' && (
                  <div style={{ background:'var(--bg2)', borderRadius:12, padding:14, marginBottom:16 }}>
                    <p style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>How many hours?</p>
                    <div className="h-scroll">
                      {[1,2,3,4,6,8].map(h=>(
                        <button key={h} className="h-scroll-item" onClick={()=>setHours(h)}
                          style={{ padding:'8px 16px', borderRadius:8, border:`2px solid ${hours===h?'var(--brand)':'var(--border)'}`, background:hours===h?'var(--brand-light)':'transparent', cursor:'pointer', fontWeight:600, fontSize:13, color:hours===h?'var(--brand)':'var(--text)', transition:'all 0.15s' }}>
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background:'var(--bg2)', borderRadius:12, padding:16, marginBottom:16 }}>
                  <p style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>📍 Your Location</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div>
                      <label className="input-label">District *</label>
                      <select className="input" value={district} onChange={e=>setDistrict(e.target.value)}>
                        {DISTRICTS.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">City / Area</label>
                      <select className="input" value={city} onChange={e=>setCity(e.target.value)}>
                        <option value="">Select city</option>
                        {cities.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Full Address *</label>
                    <input className="input" placeholder="House no, street, landmark..." value={address} onChange={e=>setAddress(e.target.value)} />
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label className="input-label">Special instructions (optional)</label>
                  <input className="input" placeholder="Enter from side gate, call on arrival..." value={notes} onChange={e=>setNotes(e.target.value)} />
                </div>

                <button className="btn btn-brand" style={{ width:'100%', padding:'13px', fontSize:15 }} onClick={goToStep2}>
                  Review Booking Details →
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step===2 && (
              <div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>Review your booking request</h3>
                
                <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:10, padding:12, marginBottom:18, fontSize:13, color:'#2563eb' }}>
                  ℹ️ <strong>Service Provider:</strong> Your service provider will be assigned by our team based on availability and service requirements.
                </div>

                <div style={{ background:'var(--bg2)', borderRadius:14, overflow:'hidden', marginBottom:18 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center', padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize: 32 }}>{svc.icon}</div>
                    <div>
                      <p style={{ fontWeight:700, fontSize:16 }}>{svc.name}</p>
                      <p style={{ fontSize:12, color:'var(--text2)' }}>
                        {svcType==='manpower'?hours+' hrs':'1 trip'}
                      </p>
                    </div>
                  </div>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--text2)' }}>
                    📍 {address}, {city||district}, {district}
                  </div>
                  {notes && (
                    <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--text2)' }}>
                      📝 {notes}
                    </div>
                  )}
                  <div style={{ padding:'14px 16px' }}>
                    {[
                      [`Estimated Base Price`, '₹'+price.base],
                      ['Platform fee (5%)', '₹'+price.fee],
                      ['GST (18%)',          '₹'+price.gst],
                    ].map(([k,v],i)=>(
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', marginBottom:8 }}>
                        <span>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:17, borderTop:'1px solid var(--border)', paddingTop:12, marginTop:4 }}>
                      <span>Estimated Total</span><span style={{ color:'var(--brand)' }}>₹{price.total}</span>
                    </div>
                    <p style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>💡 Final amount will be confirmed upon provider assignment.</p>
                  </div>
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setStep(1)}>← Back</button>
                  <button className="btn btn-brand" style={{ flex:2, padding:'13px', fontSize:15 }} disabled={loading} onClick={submitBookingRequest}>
                    {loading ? (
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <div style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                        Submitting...
                      </span>
                    ) : `Submit Booking Request`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
