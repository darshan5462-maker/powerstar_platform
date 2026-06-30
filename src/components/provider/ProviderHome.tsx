import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getAvailableBookings, getProviderBookings, acceptBooking, getProviderProfile } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Avatar from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function ProviderHome() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [online,    setOnline]    = useState(false)
  const [toggling,  setToggling]  = useState(false)
  const [requests,  setRequests]  = useState<any[]>([])
  const [myJobs,    setMyJobs]    = useState<any[]>([])
  const [kycStatus, setKycStatus] = useState<string>('pending')
  const [loading,   setLoading]   = useState(true)
  const first = profile?.full_name?.split(' ')[0] ?? 'Provider'

  const load = useCallback(async () => {
    if (!profile?.id) return
    const district = profile.district || 'Bengaluru Urban'
    const [reqs, jobs, provData] = await Promise.all([
      getAvailableBookings(district),
      getProviderBookings(profile.id),
      getProviderProfile(profile.id),
    ])
    setRequests(reqs)
    setMyJobs(jobs)
    if (provData) {
      setKycStatus(provData.kyc_status ?? 'pending')
      setOnline(provData.is_online ?? false)
    }
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  // Realtime — refresh when bookings change
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel('provider-realtime')
      .on('postgres_changes', { event: '*', schema:'public', table:'bookings' }, load)
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [profile?.id, load])

  async function toggleOnline() {
    if (!profile?.id) return
    if (kycStatus !== 'verified') {
      toast.error('Complete KYC verification first before going online!')
      nav('/provider/kyc')
      return
    }
    setToggling(true)
    const next = !online
    try {
      await supabase.from('providers')
        .upsert({ id: profile.id, is_online: next }, { onConflict: 'id' })
      setOnline(next)
      toast.success(next ? 'You are Online! Receiving job requests.' : 'You are Offline.')
    } catch { toast.error('Failed to update status') }
    finally { setToggling(false) }
  }

  async function handleAccept(bookingId: string) {
    if (!profile?.id) return
    try {
      await acceptBooking(bookingId, profile.id)
      setRequests(prev => prev.filter(r => r.id !== bookingId))
      toast.success('Job accepted! Navigate to customer location.')
      load()
    } catch { toast.error('Failed to accept — booking may have been taken') }
  }

  const earned    = myJobs.filter(j => j.status==='completed').reduce((s, j) => s + (j.total_amount||0)*0.9, 0)
  const todayJobs = myJobs.filter(j => new Date(j.created_at).toDateString() === new Date().toDateString())

  return (
    <div>
      <PageHeader
        title={`Welcome, ${first} 👷`}
        subtitle={`${profile?.district || 'Karnataka'} · Provider Dashboard`}
        action={
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {kycStatus === 'verified' ? (
              <button onClick={toggleOnline} disabled={toggling}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 18px', borderRadius:10,
                  border:`1.5px solid ${online?'rgba(22,163,74,0.4)':'var(--border)'}`,
                  background:online?'rgba(22,163,74,0.08)':'var(--bg2)',
                  cursor:'pointer', fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13,
                  color:online?'#16a34a':'var(--text2)', transition:'all 0.2s' }}>
                <div className={`toggle ${online?'on':''}`} style={{ pointerEvents:'none' }}>
                  <div className="toggle-knob" />
                </div>
                {toggling ? '...' : online ? '🟢 Online' : '⚫ Offline'}
              </button>
            ) : (
              <button className="btn btn-outline btn-sm" onClick={() => nav('/provider/kyc')}>
                ⚠️ Complete KYC to go online
              </button>
            )}
          </div>
        }
      />
      <div className="page-content">

        {/* KYC status banner */}
        {kycStatus === 'pending' && (
          <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:20 }}>
            <span style={{ fontSize:20 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#d97706' }}>KYC Verification Required</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Upload your documents to get verified and start receiving bookings.</p>
            </div>
            <button className="btn btn-sm" style={{ background:'rgba(217,119,6,0.1)', color:'#d97706', border:'1px solid rgba(217,119,6,0.3)', flexShrink:0 }}
              onClick={() => nav('/provider/kyc')}>Upload →</button>
          </div>
        )}
        {kycStatus === 'submitted' && (
          <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:20 }}>
            <span style={{ fontSize:20 }}>⏳</span>
            <div>
              <p style={{ fontWeight:700, fontSize:13, color:'#2563eb' }}>KYC Under Review</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Documents submitted. Admin will approve within 24 hours.</p>
            </div>
          </div>
        )}
        {kycStatus === 'verified' && !online && (
          <div style={{ background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:20 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#16a34a' }}>KYC Verified! Go online to receive bookings</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Toggle Online above to start receiving job requests in {profile?.district}.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          <StatCard icon="💰" iconBg="rgba(249,115,22,0.1)" label="Total Earned"   value={earned>0?'₹'+Math.round(earned).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="📋" iconBg="rgba(22,163,74,0.1)"  label="Total Jobs"     value={String(myJobs.length)} change={todayJobs.length+' today'} up={todayJobs.length>0} />
          <StatCard icon="📩" iconBg="rgba(37,99,235,0.1)"  label="New Requests"   value={String(requests.length)} change={online?'Online':'Go online'} up={online} />
          <StatCard icon="⭐" iconBg="rgba(217,119,6,0.1)"  label="KYC Status"     value={kycStatus==='verified'?'Verified':'Pending'} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {/* Live Requests — from customer bookings in same district */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Job Requests</h3>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {requests.length > 0 && <span className="badge badge-orange">{requests.length} new</span>}
                <button className="btn btn-ghost btn-sm" onClick={load} style={{ fontSize:13 }}>↻</button>
              </div>
            </div>

            {loading ? (
              <p style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Loading...</p>
            ) : requests.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📭</p>
                <p style={{ fontSize:12, color:'var(--text2)' }}>
                  {!online ? 'Go online above to receive requests' : `No requests in ${profile?.district || 'your district'} right now`}
                </p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {requests.slice(0, 3).map((r: any) => (
                  <div key={r.id} style={{ background:'rgba(249,115,22,0.05)', border:'1.5px solid rgba(249,115,22,0.2)', borderRadius:12, padding:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                        <span style={{ fontSize:20 }}>{r.category?.icon ?? '🔧'}</span>
                        <div>
                          <p style={{ fontWeight:700, fontSize:13 }}>{r.category?.name}</p>
                          <p style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{r.customer?.full_name} · {r.city}</p>
                        </div>
                      </div>
                      <p style={{ fontWeight:800, fontSize:16, color:'var(--brand)', flexShrink:0 }}>₹{r.total_amount?.toLocaleString('en-IN')}</p>
                    </div>
                    {r.customer_notes && (
                      <p style={{ fontSize:11, color:'var(--text2)', background:'var(--bg2)', borderRadius:6, padding:'5px 8px', marginBottom:8 }}>
                        💬 {r.customer_notes}
                      </p>
                    )}
                    <div style={{ display:'flex', gap:6, fontSize:11, color:'var(--text3)', marginBottom:10 }}>
                      <span>📍 {r.address}</span>
                    </div>
                    <div style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-success btn-sm" style={{ flex:1 }} onClick={() => handleAccept(r.id)}>✓ Accept</button>
                      <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => toast('Declined', { icon:'❌' })}>Decline</button>
                    </div>
                  </div>
                ))}
                {requests.length > 3 && (
                  <button className="btn btn-ghost btn-sm" style={{ width:'100%' }} onClick={() => nav('/provider/jobs')}>
                    View {requests.length - 3} more requests →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent jobs */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Recent Jobs</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => nav('/provider/myjobs')}>View all →</button>
            </div>
            {myJobs.length === 0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
                <p style={{ fontSize:12 }}>No jobs yet. Accept your first request!</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myJobs.slice(0, 5).map((j: any) => (
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
