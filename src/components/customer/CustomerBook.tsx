import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { MANPOWER, VEHICLES, calcPrice } from '@/data/services'
import { DISTRICTS, getCities } from '@/data/karnataka'
import toast from 'react-hot-toast'

async function fetchProviders(district: string, categorySlug?: string) {
  // Fetch all verified + online providers with their profile and category
  const { data: provs, error } = await supabase
    .from('providers')
    .select(`
      id, kyc_status, is_online, hourly_rate, rating, total_jobs, experience_years,
      profile:profiles!inner(full_name, phone, district, city),
      category:service_categories(name, icon, slug, base_price, price_unit)
    `)
    .eq('kyc_status', 'verified')
    .eq('is_online', true)

  if (error) throw error

  const all = provs ?? []
  const norm = (s?: string) => (s ?? '').trim().toLowerCase()

  // Filter by district — case insensitive
  const inDistrict = all.filter((p: any) => norm(p.profile?.district) === norm(district))

  console.log('🔍 Provider search:', {
    district,
    categorySlug,
    totalVerifiedOnline: all.length,
    inDistrict: inDistrict.length,
    allDistricts: [...new Set(all.map((p: any) => p.profile?.district))],
  })

  if (inDistrict.length === 0) {
    const available = [...new Set(all.map((p: any) => p.profile?.district).filter(Boolean))]
    return {
      providers: [],
      reason: `district_mismatch`,
      availableDistricts: available,
      totalOnline: all.length,
    }
  }

  // Try category match — but DON'T filter out if no match, show all district providers
  if (categorySlug) {
    const inCategory = inDistrict.filter((p: any) =>
      norm(p.category?.slug) === norm(categorySlug)
    )
    if (inCategory.length > 0) return { providers: inCategory }
    // Category doesn't match — show all district providers with a note
    return {
      providers: inDistrict,
      reason: 'category_mismatch',
      categorySlug,
    }
  }

  return { providers: inDistrict }
}

export default function CustomerBook() {
  const { profile } = useAuthStore()
  const nav = useNavigate()

  const [step,      setStep]      = useState(1)
  const [svcType,   setSvcType]   = useState<'manpower'|'vehicle'>('manpower')
  const [svcIdx,    setSvcIdx]    = useState(0)
  // Default district from profile — this is the key fix
  const [district,  setDistrict]  = useState(profile?.district || DISTRICTS[0].name)
  const [city,      setCity]      = useState(profile?.city || '')
  const [address,   setAddress]   = useState('')
  const [notes,     setNotes]     = useState('')

  const [providers,    setProviders]    = useState<any[]>([])
  const [loadResult,   setLoadResult]   = useState<any>(null)
  const [loadingProvs, setLoadingProvs] = useState(false)
  const [selectedProv, setSelectedProv] = useState<any>(null)
  const [hours,        setHours]        = useState(2)
  const [payMethod,    setPayMethod]    = useState('upi')
  const [loading,      setLoading]      = useState(false)

  const allSvcs     = svcType === 'manpower' ? MANPOWER : VEHICLES
  const svc         = allSvcs[svcIdx]
  const districtObj = DISTRICTS.find(d => d.name === district) || DISTRICTS[0]
  const cities      = getCities(districtObj.id)

  useEffect(() => { setCity('') }, [district])

  async function goToStep2() {
    if (!address.trim()) { toast.error('Enter your address'); return }
    setLoadingProvs(true)
    setProviders([])
    setSelectedProv(null)
    setLoadResult(null)
    setStep(2)
    try {
      const result = await fetchProviders(district, svc.id)
      setProviders(result.providers)
      setLoadResult(result)
    } catch (err: any) {
      setLoadResult({ error: err.message })
    } finally {
      setLoadingProvs(false)
    }
  }

  const rate  = selectedProv?.hourly_rate ?? svc.basePrice
  const price = svc.type === 'vehicle' ? calcPrice(svc.basePrice, 1) : calcPrice(rate, hours)

  async function confirmBooking() {
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
        status:         'pending',
      })
      if (error) throw error
      toast.success('Booking confirmed! Provider notified 🎉')
      nav('/dashboard/bookings')
    } catch (err: any) {
      toast.error(err?.message || 'Booking failed')
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
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
                  {allSvcs.slice(0,8).map((s,i)=>(
                    <div key={i} onClick={()=>setSvcIdx(i)}
                      style={{ padding:'12px 6px', border:`2px solid ${svcIdx===i?'var(--brand)':'var(--border)'}`, borderRadius:10, textAlign:'center', cursor:'pointer', background:svcIdx===i?'var(--brand-light)':'transparent', transition:'all 0.15s' }}>
                      <div style={{ fontSize:22, marginBottom:5 }}>{s.icon}</div>
                      <div style={{ fontSize:11, fontWeight:600, color:svcIdx===i?'var(--brand)':'var(--text)', lineHeight:1.2 }}>{s.name}</div>
                      {s.basePrice>0 && <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>₹{s.basePrice}{s.unit}</div>}
                    </div>
                  ))}
                </div>

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

                {/* Hint if profile district differs */}
                {profile?.district && profile.district !== district && (
                  <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#2563eb' }}>
                    💡 Your profile district is <strong>{profile.district}</strong>. Most providers will be available there.
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft:8, fontSize:11 }} onClick={()=>setDistrict(profile.district!)}>Switch to {profile.district}</button>
                  </div>
                )}

                <button className="btn btn-brand" style={{ width:'100%', padding:'13px', fontSize:15 }} onClick={goToStep2}>
                  Find Providers in {district} →
                </button>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step===2 && (
              <div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:4 }}>Providers in {district}</h3>
                <p style={{ color:'var(--text2)', fontSize:12, marginBottom:16 }}>
                  {svc.icon} {svc.name} · KYC-verified and online
                </p>

                {loadingProvs ? (
                  <div style={{ textAlign:'center', padding:'40px' }}>
                    <div style={{ width:32, height:32, border:'3px solid var(--border)', borderTop:'3px solid #f97316', borderRadius:'50%', margin:'0 auto 12px', animation:'spin 0.8s linear infinite' }} />
                    <p style={{ color:'var(--text2)', fontSize:13 }}>Searching providers in {district}...</p>
                  </div>

                ) : loadResult?.error ? (
                  <div style={{ textAlign:'center', padding:28, background:'rgba(220,38,38,0.05)', borderRadius:12, border:'1px solid rgba(220,38,38,0.15)' }}>
                    <p style={{ fontSize:28, marginBottom:10 }}>⚠️</p>
                    <p style={{ fontWeight:700, color:'#dc2626', marginBottom:6 }}>Failed to load providers</p>
                    <p style={{ color:'var(--text2)', fontSize:12, marginBottom:14 }}>{loadResult.error}</p>
                    <button className="btn btn-outline btn-sm" onClick={goToStep2}>↻ Try again</button>
                  </div>

                ) : providers.length===0 ? (
                  <div>
                    <div style={{ textAlign:'center', padding:'20px 0 14px' }}>
                      <p style={{ fontSize:36, marginBottom:10 }}>📍</p>
                      <p style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>No providers available in {district}</p>
                    </div>

                    {/* District mismatch — show available districts */}
                    {loadResult?.reason==='district_mismatch' && (
                      <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:12, padding:16, marginBottom:16 }}>
                        <p style={{ fontWeight:700, fontSize:13, color:'#2563eb', marginBottom:8 }}>
                          🔍 Providers are available in other districts:
                        </p>
                        {loadResult.availableDistricts?.length > 0 ? (
                          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                            {loadResult.availableDistricts.map((d: string) => (
                              <button key={d} className="btn btn-outline btn-sm"
                                style={{ fontSize:12 }}
                                onClick={()=>{setDistrict(d); setStep(1)}}>
                                Switch to {d}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize:12, color:'var(--text2)' }}>
                            No providers online right now. Check back later or contact support.
                          </p>
                        )}
                        <p style={{ fontSize:11, color:'var(--text3)', marginTop:10 }}>
                          Total verified & online providers: {loadResult.totalOnline ?? 0}
                        </p>
                      </div>
                    )}

                    <button className="btn btn-outline" style={{ width:'100%' }} onClick={()=>setStep(1)}>← Change location or service</button>
                  </div>

                ) : (
                  <>
                    {/* Category mismatch note */}
                    {loadResult?.reason==='category_mismatch' && (
                      <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:12, color:'#d97706' }}>
                        ℹ️ No providers specialise in <strong>{svc.name}</strong> in {district} yet — showing all available providers.
                      </div>
                    )}

                    <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                      {providers.map((p:any, i:number) => {
                        const name = p.profile?.full_name ?? 'Provider'
                        const r    = p.hourly_rate ?? svc.basePrice
                        const sel  = selectedProv?.id===p.id
                        return (
                          <div key={p.id??i} onClick={()=>setSelectedProv(p)}
                            style={{ display:'flex', gap:14, padding:16, border:`2px solid ${sel?'var(--brand)':'var(--border)'}`, borderRadius:14, cursor:'pointer', background:sel?'var(--brand-light)':'var(--bg2)', transition:'all 0.15s' }}>
                            <Avatar name={name} size={48} />
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                                <span style={{ fontWeight:700, fontSize:14 }}>{name}</span>
                                {Number(p.rating)>=4.8 && <span className="badge badge-orange" style={{ fontSize:10 }}>⭐ Top Rated</span>}
                                <span className="badge badge-green" style={{ fontSize:10 }}>✓ Verified</span>
                              </div>
                              <p style={{ fontSize:12, color:'var(--text2)' }}>
                                ★{p.rating>0?Number(p.rating).toFixed(1):'New'} · {p.total_jobs??0} jobs · {p.experience_years??1}+ yrs
                              </p>
                              <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                                📍 {p.profile?.district}{p.profile?.city?`, ${p.profile.city}`:''}
                                {p.category && <span> · {p.category.icon} {p.category.name}</span>}
                              </p>
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <p style={{ fontSize:20, fontWeight:800, color:'var(--brand)' }}>₹{r}</p>
                              <p style={{ fontSize:10, color:'var(--text3)' }}>{svc.unit}</p>
                              <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4, marginTop:6 }}>
                                <div className="live-dot" style={{ width:6, height:6 }} />
                                <span style={{ fontSize:10, color:'#16a34a' }}>Online</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {svcType==='manpower' && selectedProv && (
                      <div style={{ background:'var(--bg2)', borderRadius:12, padding:14, marginBottom:14 }}>
                        <p style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>How many hours?</p>
                        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                          {[1,2,3,4,6,8].map(h=>(
                            <button key={h} onClick={()=>setHours(h)}
                              style={{ padding:'8px 16px', borderRadius:8, border:`2px solid ${hours===h?'var(--brand)':'var(--border)'}`, background:hours===h?'var(--brand-light)':'transparent', cursor:'pointer', fontWeight:600, fontSize:13, color:hours===h?'var(--brand)':'var(--text)', transition:'all 0.15s' }}>
                              {h}h
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display:'flex', gap:10 }}>
                      <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setStep(1)}>← Back</button>
                      <button className="btn btn-brand"  style={{ flex:2 }} disabled={!selectedProv}
                        onClick={()=>{if(!selectedProv){toast.error('Select a provider');return};setStep(3)}}>
                        Next: Confirm →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step===3 && (
              <div>
                <h3 style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>Confirm your booking</h3>
                <div style={{ background:'var(--bg2)', borderRadius:14, overflow:'hidden', marginBottom:18 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center', padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                    <Avatar name={selectedProv?.profile?.full_name??'P'} size={40} />
                    <div>
                      <p style={{ fontWeight:700, fontSize:14 }}>{selectedProv?.profile?.full_name}</p>
                      <p style={{ fontSize:12, color:'var(--text2)' }}>
                        ★{selectedProv?.rating>0?Number(selectedProv.rating).toFixed(1):'New'} · ✓ KYC Verified · {svc.icon} {svc.name}
                      </p>
                    </div>
                    <span className="badge badge-green" style={{ marginLeft:'auto' }}>Online</span>
                  </div>
                  <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:13, color:'var(--text2)' }}>
                    📍 {address}, {city||district}, {district}
                  </div>
                  <div style={{ padding:'14px 16px' }}>
                    {[
                      [`${svc.name} (${svcType==='manpower'?hours+' hrs × ₹'+rate:'1 trip'})`, '₹'+price.base],
                      ['Platform fee (5%)', '₹'+price.fee],
                      ['GST (18%)',          '₹'+price.gst],
                    ].map(([k,v],i)=>(
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', marginBottom:8 }}>
                        <span>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:17, borderTop:'1px solid var(--border)', paddingTop:12, marginTop:4 }}>
                      <span>Total</span><span style={{ color:'var(--brand)' }}>₹{price.total}</span>
                    </div>
                    <p style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>💡 Amount charged only after job completion via OTP</p>
                  </div>
                </div>

                <div style={{ marginBottom:16 }}>
                  <label className="input-label">Special instructions (optional)</label>
                  <input className="input" placeholder="Enter from side gate, call on arrival..." value={notes} onChange={e=>setNotes(e.target.value)} />
                </div>

                <div style={{ marginBottom:18 }}>
                  <p style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Payment method</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                    {[['upi','📱','UPI'],['card','💳','Card'],['wallet','👛','Wallet'],['cash','💵','Cash']].map(([m,icon,label])=>(
                      <button key={m} onClick={()=>setPayMethod(m)}
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
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>setStep(2)}>← Back</button>
                  <button className="btn btn-brand" style={{ flex:2, padding:'13px', fontSize:15 }} disabled={loading} onClick={confirmBooking}>
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
