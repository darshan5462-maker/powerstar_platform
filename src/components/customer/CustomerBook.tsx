import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { createBooking, getVerifiedProviders } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { MANPOWER, VEHICLES, calcPrice } from '@/data/services'
import { DISTRICTS, getCities } from '@/data/karnataka'
import toast from 'react-hot-toast'

export default function CustomerBook() {
  const { profile } = useAuthStore()
  const nav = useNavigate()

  // Step state
  const [step, setStep] = useState(1)

  // Step 1 — service & location
  const [svcType,  setSvcType]  = useState<'manpower'|'vehicle'>('manpower')
  const [svcIdx,   setSvcIdx]   = useState(0)
  const [district, setDistrict] = useState(profile?.district || DISTRICTS[0].name)
  const [city,     setCity]     = useState(profile?.city || '')
  const [address,  setAddress]  = useState('')
  const [notes,    setNotes]    = useState('')

  // Step 2 — provider selection
  const [providers,    setProviders]    = useState<any[]>([])
  const [loadingProvs, setLoadingProvs] = useState(false)
  const [selectedProv, setSelectedProv] = useState<any>(null)
  const [hours,        setHours]        = useState(2)

  // Step 3 — payment
  const [payMethod, setPayMethod] = useState('upi')
  const [loading,   setLoading]   = useState(false)

  const allSvcs = svcType === 'manpower' ? MANPOWER : VEHICLES
  const svc     = allSvcs[svcIdx]

  // Get district id from name for getCities()
  const districtObj = DISTRICTS.find(d => d.name === district) || DISTRICTS[0]
  const cities      = getCities(districtObj.id)

  // When district changes, reset city
  useEffect(() => { setCity('') }, [district])

  // Load providers when moving to step 2
  async function loadProviders() {
    setLoadingProvs(true)
    setProviders([])
    setSelectedProv(null)
    try {
      const data = await getVerifiedProviders(district, svc.id)
      setProviders(data)
    } catch {
      // Fallback mock providers for demo
      setProviders([
        { id:'mock1', profile:{ full_name:'Suresh Kumar',  district }, category:{ name:svc.name, icon:svc.icon }, rating:4.9, total_jobs:142, hourly_rate:290, experience_years:8,  kyc_status:'verified', is_online:true },
        { id:'mock2', profile:{ full_name:'Mahesh Reddy',  district }, category:{ name:svc.name, icon:svc.icon }, rating:4.7, total_jobs:98,  hourly_rate:260, experience_years:5,  kyc_status:'verified', is_online:true },
        { id:'mock3', profile:{ full_name:'Kumar Swamy',   district }, category:{ name:svc.name, icon:svc.icon }, rating:4.8, total_jobs:210, hourly_rate:320, experience_years:12, kyc_status:'verified', is_online:true },
      ])
    } finally {
      setLoadingProvs(false)
    }
  }

  const rate  = selectedProv?.hourly_rate ?? svc.basePrice
  const price = svc.type === 'vehicle'
    ? calcPrice(svc.basePrice, 1)
    : calcPrice(rate, hours)

  async function confirmBooking() {
    if (!profile?.id) return
    setLoading(true)
    try {
      const { data: cat } = await supabase
        .from('service_categories').select('id').eq('slug', svc.id).maybeSingle()

      await createBooking({
        customer_id:    profile.id,
        category_id:    cat?.id || '00000000-0000-0000-0000-000000000000',
        address:        address || '123 Main Street',
        city:           city || district,
        district:       district,
        base_amount:    price.base,
        platform_fee:   price.fee,
        gst_amount:     price.gst,
        total_amount:   price.total,
        customer_notes: notes || undefined,
      })
      toast.success('Booking confirmed! Provider notified 🎉')
      nav('/dashboard/bookings')
    } catch (err: any) {
      toast.error(err?.message || 'Booking failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const STEPS = ['Service & Location', 'Choose Provider', 'Confirm & Pay']

  return (
    <div>
      <PageHeader title="Book a Service" subtitle="Find verified providers near you" />
      <div className="page-content">
        <div style={{ maxWidth:700 }}>

          {/* Step bar */}
          <div style={{ display:'flex', alignItems:'center', marginBottom:24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                  <div className={`step-circle ${i+1<step?'done':i+1===step?'active':'pending'}`}>
                    {i+1 < step ? '✓' : i+1}
                  </div>
                  <span style={{ fontSize:10, color:i+1===step?'var(--brand)':'var(--text3)', fontWeight:i+1===step?700:400, whiteSpace:'nowrap' }}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex:1, height:2, background:i+1<step?'#16a34a':'var(--border)', margin:'0 8px', marginBottom:18 }} />
                )}
              </div>
            ))}
          </div>

          <div className="glass" style={{ padding:28 }}>

            {/* ── STEP 1: Service & Location ── */}
            {step === 1 && (
              <div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>What do you need?</h3>

                {/* Service type toggle */}
                <div className="tab-bar" style={{ marginBottom:16 }}>
                  <button className={`tab-item ${svcType==='manpower'?'active':''}`} onClick={()=>{setSvcType('manpower');setSvcIdx(0)}}>👷 Manpower</button>
                  <button className={`tab-item ${svcType==='vehicle'?'active':''}`}  onClick={()=>{setSvcType('vehicle');setSvcIdx(0)}}>🚛 Vehicles</button>
                </div>

                {/* Service picker */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
                  {allSvcs.slice(0, 8).map((s, i) => (
                    <div key={i} onClick={() => setSvcIdx(i)}
                      style={{ padding:'12px 6px', border:`2px solid ${svcIdx===i?'var(--brand)':'var(--border)'}`, borderRadius:10, textAlign:'center', cursor:'pointer', background:svcIdx===i?'var(--brand-light)':'transparent', transition:'all 0.15s' }}>
                      <div style={{ fontSize:22, marginBottom:5 }}>{s.icon}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:svcIdx===i?'var(--brand)':'var(--text)', lineHeight:1.2 }}>{s.name}</div>
                      {s.basePrice > 0 && <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>₹{s.basePrice}{s.unit}</div>}
                    </div>
                  ))}
                </div>

                {/* Location — district + city only for that district */}
                <div style={{ background:'var(--bg2)', borderRadius:12, padding:16, marginBottom:16 }}>
                  <p style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>📍 Your Location</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                    <div>
                      <label className="input-label">District *</label>
                      <select className="input" value={district} onChange={e => setDistrict(e.target.value)}>
                        {DISTRICTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">City / Area *</label>
                      <select className="input" value={city} onChange={e => setCity(e.target.value)}>
                        <option value="">Select city</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Full Address *</label>
                    <input className="input" placeholder="House no, street, landmark..." value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                </div>

                <button className="btn btn-brand" style={{ width:'100%', padding:'13px', fontSize:15 }}
                  onClick={() => {
                    if (!address.trim()) { toast.error('Enter your address'); return }
                    if (!city)           { toast.error('Select your city'); return }
                    loadProviders()
                    setStep(2)
                  }}>
                  Find Providers in {district} →
                </button>
              </div>
            )}

            {/* ── STEP 2: Choose Provider ── */}
            {step === 2 && (
              <div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Available providers in {district}</h3>
                <p style={{ color:'var(--text2)', fontSize:12, marginBottom:16 }}>
                  {svc.icon} {svc.name} · {city} · Only KYC-verified providers shown
                </p>

                {loadingProvs ? (
                  <div style={{ textAlign:'center', padding:'32px', color:'var(--text3)' }}>
                    <div style={{ width:32, height:32, border:'3px solid var(--border)', borderTop:'3px solid #f97316', borderRadius:'50%', margin:'0 auto 12px', animation:'spin 0.8s linear infinite' }} />
                    Finding providers near you...
                  </div>
                ) : providers.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'32px' }}>
                    <p style={{ fontSize:32, marginBottom:10 }}>😔</p>
                    <p style={{ fontWeight:700, marginBottom:6 }}>No providers available</p>
                    <p style={{ color:'var(--text2)', fontSize:13, marginBottom:16 }}>No verified providers for {svc.name} in {district} right now.</p>
                    <button className="btn btn-outline btn-sm" onClick={() => setStep(1)}>← Change service or location</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                      {providers.map((p: any, i: number) => {
                        const name = p.profile?.full_name ?? 'Provider'
                        const rate = p.hourly_rate ?? svc.basePrice
                        const isSelected = selectedProv?.id === p.id
                        return (
                          <div key={p.id ?? i} onClick={() => setSelectedProv(p)}
                            style={{ display:'flex', gap:14, padding:16, border:`2px solid ${isSelected?'var(--brand)':'var(--border)'}`, borderRadius:14, cursor:'pointer', background:isSelected?'var(--brand-light)':'var(--bg2)', transition:'all 0.15s' }}>
                            <Avatar name={name} size={48} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                                <span style={{ fontWeight:700, fontSize:14 }}>{name}</span>
                                {p.rating >= 4.8 && <span className="badge badge-orange" style={{ fontSize:10 }}>Top Rated</span>}
                                <span className="badge badge-green" style={{ fontSize:10 }}>✓ Verified</span>
                              </div>
                              <p style={{ fontSize:12, color:'var(--text2)' }}>
                                ★{p.rating ?? 4.5} · {p.total_jobs ?? 0} jobs · {p.experience_years ?? 1}+ yrs
                              </p>
                              {p.skills_tags?.length > 0 && (
                                <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:6 }}>
                                  {p.skills_tags.slice(0,3).map((t: string) => (
                                    <span key={t} style={{ fontSize:10, background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, padding:'2px 6px', color:'var(--text2)' }}>{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <p style={{ fontSize:20, fontWeight:800, color:'var(--brand)' }}>₹{rate}</p>
                              <p style={{ fontSize:10, color:'var(--text3)' }}>{svc.unit}</p>
                              <div className="live-dot" style={{ width:6, height:6, marginLeft:'auto', marginTop:6 }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Duration selector for manpower */}
                    {svcType === 'manpower' && selectedProv && (
                      <div style={{ background:'var(--bg2)', borderRadius:12, padding:14, marginBottom:14 }}>
                        <p style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>How many hours?</p>
                        <div style={{ display:'flex', gap:8 }}>
                          {[1, 2, 3, 4, 6, 8].map(h => (
                            <button key={h} onClick={() => setHours(h)}
                              style={{ padding:'8px 14px', borderRadius:8, border:`2px solid ${hours===h?'var(--brand)':'var(--border)'}`, background:hours===h?'var(--brand-light)':'transparent', cursor:'pointer', fontWeight:600, fontSize:13, color:hours===h?'var(--brand)':'var(--text)', transition:'all 0.15s' }}>
                              {h}h
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div style={{ display:'flex', gap:10, marginTop:4 }}>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-brand"  style={{ flex:2 }} disabled={!selectedProv}
                    onClick={() => { if (!selectedProv) { toast.error('Select a provider'); return }; setStep(3) }}>
                    Next: Confirm →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirm & Pay ── */}
            {step === 3 && (
              <div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>Confirm your booking</h3>

                {/* Booking summary */}
                <div style={{ background:'var(--bg2)', borderRadius:14, overflow:'hidden', marginBottom:18 }}>
                  {/* Provider row */}
                  <div style={{ display:'flex', gap:12, alignItems:'center', padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                    <Avatar name={selectedProv?.profile?.full_name ?? 'P'} size={40} />
                    <div>
                      <p style={{ fontWeight:700, fontSize:14 }}>{selectedProv?.profile?.full_name}</p>
                      <p style={{ fontSize:12, color:'var(--text2)' }}>★{selectedProv?.rating ?? 4.5} · KYC Verified · {svc.icon} {svc.name}</p>
                    </div>
                    <span className="badge badge-green" style={{ marginLeft:'auto' }}>Online</span>
                  </div>

                  {/* Location row */}
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--text2)' }}>
                    📍 {address}, {city}, {district}
                  </div>

                  {/* Price breakdown */}
                  <div style={{ padding:'14px 16px' }}>
                    {[
                      [`${svc.name} (${svcType==='manpower'?hours+' hrs × ₹'+(selectedProv?.hourly_rate??svc.basePrice):'1 trip'})`,'₹'+price.base],
                      ['Platform fee (5%)', '₹'+price.fee],
                      ['GST (18%)',          '₹'+price.gst],
                    ].map(([k,v],i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', marginBottom:8 }}>
                        <span>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:17, borderTop:'1px solid var(--border)', paddingTop:12, marginTop:4 }}>
                      <span>Total</span>
                      <span style={{ color:'var(--brand)' }}>₹{price.total}</span>
                    </div>
                    <p style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>💡 Amount charged only after job completion via OTP</p>
                  </div>
                </div>

                {/* Notes */}
                <div style={{ marginBottom:16 }}>
                  <label className="input-label">Special instructions (optional)</label>
                  <input className="input" placeholder="Enter from side gate, call on arrival..." value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                {/* Payment method */}
                <div style={{ marginBottom:18 }}>
                  <p style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Payment method</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {[['upi','📱','UPI'],['card','💳','Card'],['wallet','👛','Wallet'],['cash','💵','Cash']].map(([m,icon,label]) => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        style={{ padding:'12px 6px', borderRadius:10, border:`2px solid ${payMethod===m?'var(--brand)':'var(--border)'}`, background:payMethod===m?'var(--brand-light)':'var(--bg2)', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s' }}>
                        <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
                        <div style={{ fontSize:11, fontWeight:600, color:payMethod===m?'var(--brand)':'var(--text)' }}>{label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:10, padding:12, marginBottom:18, fontSize:12, color:'#16a34a' }}>
                  🛡️ Work guarantee · KYC verified provider · Free cancellation before arrival
                </div>

                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={() => setStep(2)}>← Back</button>
                  <button className="btn btn-brand"   style={{ flex:2, padding:'13px', fontSize:15 }} disabled={loading} onClick={confirmBooking}>
                    {loading ? (
                      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                        <div style={{ width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                        Confirming...
                      </span>
                    ) : `Confirm & Book · ₹${price.total}`}
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
