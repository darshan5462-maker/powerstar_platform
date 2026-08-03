import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getProviderBookings, acceptBooking } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import { useProviderLocation } from '@/hooks/useProviderLocation'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import ActiveJobCard from '@/components/provider/ActiveJobCard'
import toast from 'react-hot-toast'

interface Coords { lat: number; lng: number }

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
  const [myCoords,   setMyCoords]   = useState<Coords|null>(null)

  const profileRef  = useRef(profile)
  const categoryRef = useRef<string|null>(null)
  const districtRef = useRef(profile?.district)

  useEffect(() => {
    profileRef.current  = profile
    districtRef.current = profile?.district
  }, [profile])

  const first = profile?.full_name?.split(' ')[0] ?? 'Provider'

  // ── GPS broadcasting when online ──────────────────────────
  useProviderLocation(profile?.id, online && kycStatus === 'verified')

  // ── Also track own coords for ActiveJobCard map ───────────
  useEffect(() => {
    if (!online || !navigator.geolocation) return
    const w = navigator.geolocation.watchPosition(
      p => setMyCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    )
    return () => navigator.geolocation.clearWatch(w)
  }, [online])

  async function fetchRequests(district: string, catId: string | null) {
    let q = supabase.from('bookings')
      .select(`*, category:service_categories(name,icon,slug),
        customer:profiles!bookings_customer_id_fkey(full_name,phone)`)
      .eq('status', 'pending')
      .ilike('district', district.trim())
      .order('created_at', { ascending: false })
      .limit(20)
    if (catId) q = q.eq('category_id', catId)
    const { data, error } = await q
    if (error) console.error('Fetch requests:', error.message)
    return data ?? []
  }

  async function loadAll() {
    const p = profileRef.current
    if (!p?.id) return
    const { data: provRow } = await supabase.from('providers')
      .select('kyc_status, is_online, category_id')
      .eq('id', p.id).maybeSingle()

    setKycStatus(provRow?.kyc_status  ?? 'pending')
    setOnline(provRow?.is_online      ?? false)
    setCategoryId(provRow?.category_id ?? null)
    categoryRef.current = provRow?.category_id ?? null

    const district = p.district || 'Bengaluru Urban'
    const [reqs, jobs] = await Promise.all([
      fetchRequests(district, provRow?.category_id ?? null),
      getProviderBookings(p.id),
    ])
    setRequests(reqs)
    setMyJobs(jobs)
    const active = jobs.find((j: any) => j.status === 'accepted' || j.status === 'active')
    setActiveJob(active ?? null)
    setLoading(false)
  }

  useEffect(() => { if (profile?.id) loadAll() }, [profile?.id]) // eslint-disable-line

  // Stable realtime
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel(`pvhome-${profile.id}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'bookings' },
        async (payload: any) => {
          const b = payload.new
          const norm = (s?: string) => (s ?? '').trim().toLowerCase()
          if (norm(b.district) !== norm(profileRef.current?.district)) return
          if (categoryRef.current && b.category_id !== categoryRef.current) return
          toast('📩 New job request!', { icon:'🔔', duration:6000 })
          const reqs = await fetchRequests(profileRef.current?.district || '', categoryRef.current)
          setRequests(reqs)
        }
      )
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'bookings' },
        async () => {
          const p = profileRef.current
          if (!p?.id) return
          const [reqs, jobs] = await Promise.all([
            fetchRequests(p.district || '', categoryRef.current),
            getProviderBookings(p.id),
          ])
          setRequests(reqs)
          setMyJobs(jobs)
          const active = jobs.find((j: any) => j.status==='accepted'||j.status==='active')
          setActiveJob(active ?? null)
        }
      )
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'providers',
        filter: `id=eq.${profile.id}` },
        (payload: any) => {
          const { kyc_status: ks, is_online: io, category_id: cat } = payload.new ?? {}
          if (ks) { setKycStatus(ks); if (ks==='verified') toast.success('🎉 KYC Approved!') }
          if (typeof io === 'boolean') setOnline(io)
          if (cat) { setCategoryId(cat); categoryRef.current = cat }
        }
      )
      .subscribe(s => console.log('RT:', s))
    return () => { supabase.removeChannel(ch) }
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
      toast.success('✅ Job accepted! Navigate to customer.')
      loadAll()
    } catch { toast.error('Failed — may have been taken') }
  }

  async function startJob(id: string) {
    const { error } = await supabase.from('bookings')
      .update({ status: 'active', started_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Failed to start'); return }
    toast.success('Job started! Ask customer for OTP.')
    loadAll()
  }

  async function completeJob(id: string) {
    const { error } = await supabase.from('bookings')
      .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id)
    if (error) { toast.error('Failed to complete'); return }
    toast.success('🎉 Job completed! Payment will be settled within 24 hours.')
    setActiveJob(null)
    loadAll()
  }

  const earned    = myJobs.filter(j => j.status==='completed').reduce((s, j) => s+(j.total_amount||0)*0.9, 0)
  const todayJobs = myJobs.filter(j => new Date(j.created_at).toDateString()===new Date().toDateString())

  return (
    <div>
      <PageHeader
        title={`Welcome, ${first} 👷`}
        subtitle={`${profile?.district||'Karnataka'} · Provider Dashboard`}
        action={
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
              background: kycStatus==='verified'?'rgba(22,163,74,0.1)':kycStatus==='submitted'?'rgba(37,99,235,0.1)':'rgba(217,119,6,0.1)',
              color: kycStatus==='verified'?'#16a34a':kycStatus==='submitted'?'#2563eb':'#d97706',
              border:`1px solid ${kycStatus==='verified'?'rgba(22,163,74,0.3)':kycStatus==='submitted'?'rgba(37,99,235,0.3)':'rgba(217,119,6,0.3)'}`,
              textTransform:'capitalize' as const }}>
              KYC: {kycStatus==='loading'?'...':kycStatus}
            </span>
            <button onClick={toggleOnline} disabled={toggling||kycStatus!=='verified'}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 18px', borderRadius:10,
                border:`1.5px solid ${online?'rgba(22,163,74,0.4)':'var(--border)'}`,
                background:online?'rgba(22,163,74,0.08)':'var(--bg2)',
                cursor:kycStatus==='verified'?'pointer':'not-allowed', opacity:kycStatus==='verified'?1:0.5,
                fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13,
                color:online?'#16a34a':'var(--text2)', transition:'all 0.2s' }}>
              <div className={`toggle ${online?'on':''}`} style={{ pointerEvents:'none' }}><div className="toggle-knob"/></div>
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

        {/* GPS status when online */}
        {online && (
          <div style={{ background:'rgba(22,163,74,0.05)', border:'1px solid rgba(22,163,74,0.15)', borderRadius:10, padding:'9px 14px', display:'flex', alignItems:'center', gap:8, marginBottom:16, fontSize:12 }}>
            {myCoords ? (
              <><div className="live-dot" style={{ width:6, height:6 }}/><span style={{ color:'#16a34a', fontWeight:600 }}>GPS Active — broadcasting your location to customers</span></>
            ) : (
              <><span style={{ fontSize:14 }}>📍</span><span style={{ color:'var(--text2)' }}>Getting your GPS location...</span></>
            )}
          </div>
        )}

        {/* Active Job Card — full map navigation */}
        {activeJob && (
          <ActiveJobCard
            job={activeJob}
            myCoords={myCoords}
            onStartJob={startJob}
            onCompleteJob={completeJob}
            onRefresh={loadAll}
          />
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          <StatCard icon="💰" iconBg="rgba(249,115,22,0.1)" label="Total Earned" value={earned>0?'₹'+Math.round(earned).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="📋" iconBg="rgba(22,163,74,0.1)"  label="Total Jobs"   value={String(myJobs.length)} change={todayJobs.length+' today'} up={todayJobs.length>0} />
          <StatCard icon="📩" iconBg="rgba(37,99,235,0.1)"  label="Requests"     value={String(requests.length)} change={online?'Live':'Go online'} up={online} />
          <StatCard icon="🔐" iconBg="rgba(217,119,6,0.1)"  label="KYC"          value={kycStatus==='loading'?'...':kycStatus.charAt(0).toUpperCase()+kycStatus.slice(1)} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {/* Job Requests */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <h3 style={{ fontWeight:700, fontSize:14 }}>Job Requests</h3>
                {online && <div className="live-dot" style={{ width:6, height:6 }}/>}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                {requests.length>0 && <span className="badge badge-orange">{requests.length} new</span>}
                <button className="btn btn-ghost btn-sm" onClick={loadAll}>↻</button>
              </div>
            </div>
            {loading ? (
              <p style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Loading...</p>
            ) : requests.length===0 ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📭</p>
                <p style={{ fontSize:12, color:'var(--text2)', marginBottom:10 }}>
                  {kycStatus!=='verified'?'Get KYC verified first':!online?'Go online to receive requests':'No pending requests right now'}
                </p>
                <button className="btn btn-ghost btn-sm" onClick={loadAll}>↻ Refresh</button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {requests.map((r: any) => (
                  <div key={r.id} style={{ background:'rgba(249,115,22,0.05)', border:'1.5px solid rgba(249,115,22,0.2)', borderRadius:12, padding:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:20 }}>{r.category?.icon??'🔧'}</span>
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
            {myJobs.length===0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
                <p style={{ fontSize:12 }}>No jobs yet. Accept your first request!</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myJobs.slice(0,5).map((j: any) => (
                  <div key={j.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontSize:18, width:28, textAlign:'center', flexShrink:0 }}>{j.category?.icon??'🔧'}</div>
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
                      <StatusBadge status={j.status}/>
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
