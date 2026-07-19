import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getProviderBookings, acceptBooking } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function ProviderHome() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [online,     setOnline]     = useState(false)
  const [toggling,   setToggling]   = useState(false)
  const [requests,   setRequests]   = useState<any[]>([])
  const [myJobs,     setMyJobs]     = useState<any[]>([])
  const [kycStatus,  setKycStatus]  = useState<string>('loading')
  const [categoryId, setCategoryId] = useState<string|null>(null)
  const [loading,    setLoading]    = useState(true)
  const [activeJob,  setActiveJob]  = useState<any>(null)

  const profileRef   = useRef(profile)
  const categoryRef  = useRef<string|null>(null)
  const districtRef  = useRef(profile?.district)

  useEffect(() => {
    profileRef.current  = profile
    districtRef.current = profile?.district
  }, [profile])

  const first = profile?.full_name?.split(' ')[0] ?? 'Provider'

  // Fetch ONLY pending bookings matching provider's category AND district
  async function fetchRequests(district: string, catId: string | null) {
    let q = supabase
      .from('bookings')
      .select(`
        *,
        category:service_categories(name, icon, slug),
        customer:profiles!bookings_customer_id_fkey(full_name, phone)
      `)
      .eq('status', 'pending')
      .ilike('district', district.trim())
      .order('created_at', { ascending: false })
      .limit(20)

    // Only filter by category if provider has one set
    if (catId) q = q.eq('category_id', catId)

    const { data, error } = await q
    if (error) console.error('Fetch requests error:', error.message)
    console.log(`Requests [district=${district}, category=${catId}]:`, data?.length ?? 0)
    return data ?? []
  }

  async function loadAll() {
    const p = profileRef.current
    if (!p?.id) return

    // Get provider row including category_id
    const { data: provRow } = await supabase
      .from('providers')
      .select('kyc_status, is_online, category_id')
      .eq('id', p.id)
      .maybeSingle()

    const ks  = provRow?.kyc_status  ?? 'pending'
    const io  = provRow?.is_online   ?? false
    const cat = provRow?.category_id ?? null

    setKycStatus(ks)
    setOnline(io)
    setCategoryId(cat)
    categoryRef.current = cat

    const district = p.district || 'Bengaluru Urban'
    const [reqs, jobs] = await Promise.all([
      fetchRequests(district, cat),
      getProviderBookings(p.id),
    ])

    setRequests(reqs)
    setMyJobs(jobs)

    // Set active job if any accepted/active
    const active = jobs.find(j => j.status === 'accepted' || j.status === 'active')
    setActiveJob(active ?? null)

    setLoading(false)
  }

  useEffect(() => {
    if (profile?.id) loadAll()
  }, [profile?.id]) // eslint-disable-line

  // Stable realtime
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel(`prov-home-${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' },
        async (payload: any) => {
          const b   = payload.new
          const p   = profileRef.current
          const cat = categoryRef.current
          const norm = (s?: string) => (s ?? '').trim().toLowerCase()
          if (norm(b.district) !== norm(p?.district)) return
          if (cat && b.category_id !== cat) return
          toast('📩 New job request!', { icon: '🔔', duration: 6000 })
          const reqs = await fetchRequests(p?.district || '', cat)
          setRequests(reqs)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' },
        async () => {
          const p   = profileRef.current
          const cat = categoryRef.current
          if (!p?.id) return
          const [reqs, jobs] = await Promise.all([
            fetchRequests(p.district || '', cat),
            getProviderBookings(p.id),
          ])
          setRequests(reqs)
          setMyJobs(jobs)
          const active = jobs.find((j:any) => j.status==='accepted'||j.status==='active')
          setActiveJob(active ?? null)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'providers',
        filter: `id=eq.${profile.id}` },
        (payload: any) => {
          const { kyc_status: ks, is_online: io, category_id: cat } = payload.new ?? {}
          if (ks) { setKycStatus(ks); if (ks==='verified') toast.success('🎉 KYC Approved!') }
          if (typeof io === 'boolean') setOnline(io)
          if (cat) { setCategoryId(cat); categoryRef.current = cat }
        }
      )
      .subscribe((status) => console.log('RT:', status))
    return () => { supabase.removeChannel(channel) }
  }, [profile?.id]) // eslint-disable-line

  async function toggleOnline() {
    if (!profile?.id) return
    if (kycStatus !== 'verified') { toast.error('Complete KYC first!'); nav('/provider/kyc'); return }
    setToggling(true)
    const next = !online
    const { error } = await supabase.from('providers').upsert({ id: profile.id, is_online: next }, { onConflict: 'id' })
    if (error) { toast.error('Failed: ' + error.message); setToggling(false); return }
    setOnline(next)
    toast.success(next ? '🟢 Online! Receiving requests.' : '⚫ Offline.')
    setToggling(false)
  }

  async function accept(bookingId: string) {
    if (!profile?.id) return
    try {
      await acceptBooking(bookingId, profile.id)
      setRequests(prev => prev.filter(r => r.id !== bookingId))
      toast.success('✅ Job accepted! Customer has been notified.')
      await loadAll()
    } catch { toast.error('Failed — booking may have been taken') }
  }

  async function startJob(bookingId: string) {
    const { error } = await supabase.from('bookings').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', bookingId)
    if (error) { toast.error('Failed to start job'); return }
    toast.success('Job started! Share OTP with customer to begin.')
    await loadAll()
  }

  async function completeJob(bookingId: string) {
    const { error } = await supabase.from('bookings').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', bookingId)
    if (error) { toast.error('Failed to complete job'); return }
    toast.success('🎉 Job completed! Payment will be settled within 24 hours.')
    setActiveJob(null)
    await loadAll()
  }

  const earned    = myJobs.filter(j=>j.status==='completed').reduce((s,j)=>s+(j.total_amount||0)*0.9, 0)
  const todayJobs = myJobs.filter(j=>new Date(j.created_at).toDateString()===new Date().toDateString())

  return (
    <div>
      <PageHeader
        title={`Welcome, ${first} 👷`}
        subtitle={`${profile?.district || 'Karnataka'} · Provider Dashboard`}
        action={
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
              background: kycStatus==='verified'?'rgba(22,163,74,0.1)':kycStatus==='submitted'?'rgba(37,99,235,0.1)':'rgba(217,119,6,0.1)',
              color: kycStatus==='verified'?'#16a34a':kycStatus==='submitted'?'#2563eb':'#d97706',
              border:`1px solid ${kycStatus==='verified'?'rgba(22,163,74,0.3)':kycStatus==='submitted'?'rgba(37,99,235,0.3)':'rgba(217,119,6,0.3)'}`,
              textTransform:'capitalize' as const,
            }}>KYC: {kycStatus==='loading'?'...':kycStatus}</span>
            <button onClick={toggleOnline} disabled={toggling||kycStatus!=='verified'}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 18px', borderRadius:10,
                border:`1.5px solid ${online?'rgba(22,163,74,0.4)':'var(--border)'}`,
                background:online?'rgba(22,163,74,0.08)':'var(--bg2)',
                cursor:kycStatus==='verified'?'pointer':'not-allowed', opacity:kycStatus==='verified'?1:0.5,
                fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13,
                color:online?'#16a34a':'var(--text2)', transition:'all 0.2s' }}>
              <div className={`toggle ${online?'on':''}`} style={{ pointerEvents:'none' }}><div className="toggle-knob" /></div>
              {toggling?'...':online?'🟢 Online':'⚫ Offline'}
            </button>
          </div>
        }
      />
      <div className="page-content">

        {/* KYC banners */}
        {kycStatus==='pending' && (
          <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:18 }}>
            <span style={{ fontSize:20 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#d97706' }}>KYC Verification Required</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Upload documents to get verified and start receiving bookings.</p>
            </div>
            <button className="btn btn-sm" style={{ flexShrink:0, background:'rgba(217,119,6,0.1)', color:'#d97706', border:'1px solid rgba(217,119,6,0.3)' }} onClick={()=>nav('/provider/kyc')}>Upload →</button>
          </div>
        )}
        {kycStatus==='submitted' && (
          <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:18 }}>
            <span>⏳</span>
            <div><p style={{ fontWeight:700, fontSize:13, color:'#2563eb' }}>KYC Under Review</p><p style={{ fontSize:12, color:'var(--text2)' }}>Admin will approve within 24 hours.</p></div>
          </div>
        )}
        {kycStatus==='verified' && !online && (
          <div style={{ background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:18 }}>
            <span>✅</span>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#16a34a' }}>KYC Verified! Toggle Online to receive bookings</p>
              <p style={{ fontSize:12, color:'var(--text2)' }}>Go online above to start receiving requests in {profile?.district}.</p>
            </div>
          </div>
        )}

        {/* Active job card — shown when provider has accepted a job */}
        {activeJob && (
          <div style={{ background:'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(234,88,12,0.04))', border:'2px solid rgba(249,115,22,0.3)', borderRadius:16, padding:22, marginBottom:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div className="live-dot" style={{ width:8, height:8 }} />
                  <span style={{ fontWeight:800, fontSize:16, color:'var(--brand)' }}>
                    {activeJob.status==='accepted'?'Job Accepted — Head to Customer':'Job In Progress'}
                  </span>
                </div>
                <p style={{ fontSize:12, color:'var(--text2)' }}>Booking #{activeJob.booking_ref}</p>
              </div>
              <StatusBadge status={activeJob.status} />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16 }}>
              <div style={{ background:'var(--bg2)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Customer</p>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <Avatar name={activeJob.customer?.full_name ?? 'C'} size={28} />
                  <div>
                    <p style={{ fontSize:13, fontWeight:700 }}>{activeJob.customer?.full_name}</p>
                    <p style={{ fontSize:11, color:'var(--text2)' }}>{activeJob.customer?.phone ?? '—'}</p>
                  </div>
                </div>
              </div>
              <div style={{ background:'var(--bg2)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Location</p>
                <p style={{ fontSize:13, fontWeight:600 }}>📍 {activeJob.address}</p>
                <p style={{ fontSize:11, color:'var(--text2)', marginTop:2 }}>{activeJob.city}, {activeJob.district}</p>
              </div>
              <div style={{ background:'var(--bg2)', borderRadius:10, padding:'12px 14px' }}>
                <p style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Service</p>
                <p style={{ fontSize:13, fontWeight:600 }}>{activeJob.category?.icon} {activeJob.category?.name}</p>
                <p style={{ fontSize:13, fontWeight:800, color:'var(--brand)', marginTop:2 }}>₹{Math.round((activeJob.total_amount||0)*0.9).toLocaleString('en-IN')} <span style={{ fontSize:11, fontWeight:400, color:'var(--text3)' }}>your earning</span></p>
              </div>
              <div style={{ background:'rgba(249,115,22,0.08)', borderRadius:10, padding:'12px 14px', border:'1px solid rgba(249,115,22,0.2)' }}>
                <p style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Start OTP (share with customer)</p>
                <p style={{ fontSize:28, fontWeight:900, letterSpacing:4, color:'var(--brand)', fontFamily:'monospace' }}>
                  {activeJob.start_otp ?? '----'}
                </p>
              </div>
            </div>

            {activeJob.customer_notes && (
              <div style={{ background:'var(--bg2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--text2)', marginBottom:14 }}>
                💬 Customer note: {activeJob.customer_notes}
              </div>
            )}

            <div style={{ display:'flex', gap:10 }}>
              <a href={`tel:${activeJob.customer?.phone}`} className="btn btn-outline" style={{ flex:1, textAlign:'center', textDecoration:'none' }}>
                📞 Call Customer
              </a>
              {activeJob.status==='accepted' && (
                <button className="btn btn-brand" style={{ flex:2 }} onClick={()=>startJob(activeJob.id)}>
                  ▶ Start Job
                </button>
              )}
              {activeJob.status==='active' && (
                <button className="btn btn-success" style={{ flex:2 }} onClick={()=>completeJob(activeJob.id)}>
                  ✅ Mark Complete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          <StatCard icon="💰" iconBg="rgba(249,115,22,0.1)" label="Total Earned" value={earned>0?'₹'+Math.round(earned).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="📋" iconBg="rgba(22,163,74,0.1)"  label="Total Jobs"   value={String(myJobs.length)} change={todayJobs.length+' today'} up={todayJobs.length>0} />
          <StatCard icon="📩" iconBg="rgba(37,99,235,0.1)"  label="New Requests" value={String(requests.length)} change={online?'Live':'Go online'} up={online} />
          <StatCard icon="🔐" iconBg="rgba(217,119,6,0.1)"  label="KYC" value={kycStatus==='loading'?'...':kycStatus.charAt(0).toUpperCase()+kycStatus.slice(1)} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {/* Job Requests */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <h3 style={{ fontWeight:700, fontSize:14 }}>Job Requests</h3>
                {online && <div className="live-dot" style={{ width:6, height:6 }} />}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {requests.length > 0 && <span className="badge badge-orange">{requests.length} new</span>}
                <button className="btn btn-ghost btn-sm" onClick={loadAll}>↻</button>
              </div>
            </div>
            {loading ? (
              <p style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Loading...</p>
            ) : requests.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📭</p>
                <p style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>
                  {kycStatus!=='verified'?'Get KYC verified first':!online?'Go online to receive requests':'No pending requests in your area'}
                </p>
                <button className="btn btn-ghost btn-sm" onClick={loadAll}>↻ Refresh</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {requests.map((r:any) => (
                  <div key={r.id} style={{ background:'rgba(249,115,22,0.05)', border:'1.5px solid rgba(249,115,22,0.2)', borderRadius:12, padding:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:20 }}>{r.category?.icon ?? '🔧'}</span>
                        <div>
                          <p style={{ fontWeight:700, fontSize:13 }}>{r.category?.name}</p>
                          <p style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{r.customer?.full_name} · {r.city}</p>
                        </div>
                      </div>
                      <p style={{ fontWeight:800, fontSize:16, color:'var(--brand)', flexShrink:0 }}>₹{(r.total_amount||0).toLocaleString('en-IN')}</p>
                    </div>
                    {r.customer_notes && (
                      <p style={{ fontSize:11, color:'var(--text2)', background:'var(--bg)', borderRadius:6, padding:'5px 8px', marginBottom:8 }}>💬 {r.customer_notes}</p>
                    )}
                    <p style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>📍 {r.address}, {r.district}</p>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-success" style={{ flex:2 }} onClick={()=>accept(r.id)}>✓ Accept Job</button>
                      <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>toast('Declined',{icon:'❌'})}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Jobs */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Recent Jobs</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>nav('/provider/myjobs')}>View all →</button>
            </div>
            {myJobs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
                <p style={{ fontSize:12 }}>No jobs yet.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myJobs.slice(0,5).map((j:any) => (
                  <div key={j.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:18, width:28, textAlign:'center', flexShrink:0 }}>{j.category?.icon ?? '🔧'}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {j.customer?.full_name} — {j.category?.name}
                      </p>
                      <p style={{ fontSize:10, color:'var(--text2)', marginTop:1 }}>
                        {new Date(j.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                      </p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:'var(--brand)' }}>₹{Math.round((j.total_amount||0)*0.9).toLocaleString('en-IN')}</p>
                      <StatusBadge status={j.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
