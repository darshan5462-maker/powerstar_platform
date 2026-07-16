import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getProviderBookings, acceptBooking } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function ProviderHome() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [online,    setOnline]    = useState(false)
  const [toggling,  setToggling]  = useState(false)
  const [requests,  setRequests]  = useState<any[]>([])
  const [myJobs,    setMyJobs]    = useState<any[]>([])
  const [kycStatus, setKycStatus] = useState<string>('loading')
  const [notifs,    setNotifs]    = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const first = profile?.full_name?.split(' ')[0] ?? 'Provider'

  // Fetch ALL pending bookings in provider's district (not just their own)
  async function loadRequests(district: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        category:service_categories(name,icon),
        customer:profiles!bookings_customer_id_fkey(full_name,phone)
      `)
      .eq('status', 'pending')
      .eq('district', district)
      .order('created_at', { ascending: false })
      .limit(10)
    if (error) console.error('Requests error:', error)
    return data ?? []
  }

  const load = useCallback(async () => {
    if (!profile?.id) return

    // Get provider row
    const { data: provRow } = await supabase
      .from('providers')
      .select('kyc_status, is_online')
      .eq('id', profile.id)
      .maybeSingle()

    const ks = provRow?.kyc_status ?? 'pending'
    const ol = provRow?.is_online  ?? false
    setKycStatus(ks)
    setOnline(ol)

    const district = profile.district || 'Bengaluru Urban'

    // Load in parallel
    const [reqs, jobs, notifications] = await Promise.all([
      loadRequests(district),
      getProviderBookings(profile.id),
      supabase.from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(r => r.data ?? []),
    ])

    setRequests(reqs)
    setMyJobs(jobs)
    setNotifs(notifications)
    setLoading(false)
  }, [profile?.id, profile?.district])

  useEffect(() => { load() }, [load])

  // Realtime — listen for new bookings in provider's district
  useEffect(() => {
    if (!profile?.id || !profile?.district) return

    const channel = supabase.channel(`provider-${profile.id}`)
      // New booking in same district
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `district=eq.${profile.district}`,
      }, (payload) => {
        toast('📩 New job request in your area!', { icon: '🔔', duration: 5000 })
        load() // Reload to get fresh data with joins
      })
      // Booking accepted/cancelled by someone else
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
      }, () => { load() })
      // KYC status change
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'providers',
        filter: `id=eq.${profile.id}`,
      }, (payload: any) => {
        const newStatus = payload.new?.kyc_status
        const newOnline = payload.new?.is_online
        if (newStatus) {
          setKycStatus(newStatus)
          if (newStatus === 'verified') toast.success('🎉 Your KYC has been approved! You can now go online.')
          if (newStatus === 'rejected') toast.error('❌ Your KYC was rejected. Please re-upload documents.')
        }
        if (typeof newOnline === 'boolean') setOnline(newOnline)
      })
      // New notification
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.id}`,
      }, (payload: any) => {
        toast(payload.new?.title ?? 'New notification', { icon: '🔔' })
        setNotifs(prev => [payload.new, ...prev].slice(0, 5))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id, profile?.district, load])

  async function toggleOnline() {
    if (!profile?.id) return
    if (kycStatus !== 'verified') {
      toast.error('Complete KYC verification first!')
      nav('/provider/kyc')
      return
    }
    setToggling(true)
    const next = !online
    try {
      const { error } = await supabase
        .from('providers')
        .upsert({ id: profile.id, is_online: next }, { onConflict: 'id' })
      if (error) throw error
      setOnline(next)
      toast.success(next ? '🟢 You are Online! Receiving job requests.' : '⚫ You are Offline.')
    } catch (err: any) {
      toast.error('Failed: ' + err.message)
    } finally {
      setToggling(false)
    }
  }

  async function accept(bookingId: string) {
    if (!profile?.id) return
    try {
      await acceptBooking(bookingId, profile.id)
      setRequests(prev => prev.filter(r => r.id !== bookingId))
      toast.success('✅ Job accepted! Navigate to customer location.')
      load()
    } catch { toast.error('Failed to accept — may have been taken') }
  }

  async function markNotifRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifs(prev => prev.filter(n => n.id !== id))
  }

  const earned    = myJobs.filter(j => j.status==='completed').reduce((s,j) => s+(j.total_amount||0)*0.9, 0)
  const todayJobs = myJobs.filter(j => new Date(j.created_at).toDateString() === new Date().toDateString())

  return (
    <div>
      <PageHeader
        title={`Welcome, ${first} 👷`}
        subtitle={`${profile?.district || 'Karnataka'} · Provider Dashboard`}
        action={
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {notifs.length > 0 && (
              <div style={{ position:'relative' }}>
                <button className="btn btn-outline btn-sm" onClick={() => nav('/provider/notifications')}>
                  🔔 {notifs.length}
                </button>
              </div>
            )}
            <span style={{
              fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:20,
              background: kycStatus==='verified'?'rgba(22,163,74,0.1)':kycStatus==='submitted'?'rgba(37,99,235,0.1)':'rgba(217,119,6,0.1)',
              color:      kycStatus==='verified'?'#16a34a':kycStatus==='submitted'?'#2563eb':'#d97706',
              border:`1px solid ${kycStatus==='verified'?'rgba(22,163,74,0.3)':kycStatus==='submitted'?'rgba(37,99,235,0.3)':'rgba(217,119,6,0.3)'}`,
              textTransform:'capitalize' as const,
            }}>
              KYC: {kycStatus==='loading'?'...':kycStatus}
            </span>
            <button
              onClick={toggleOnline}
              disabled={toggling || kycStatus !== 'verified'}
              title={kycStatus !== 'verified' ? 'Complete KYC first' : undefined}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 18px', borderRadius:10,
                border:`1.5px solid ${online?'rgba(22,163,74,0.4)':'var(--border)'}`,
                background:online?'rgba(22,163,74,0.08)':'var(--bg2)',
                cursor:kycStatus==='verified'?'pointer':'not-allowed',
                opacity:kycStatus==='verified'?1:0.5,
                fontFamily:'Inter,sans-serif', fontWeight:600, fontSize:13,
                color:online?'#16a34a':'var(--text2)', transition:'all 0.2s',
              }}>
              <div className={`toggle ${online?'on':''}`} style={{ pointerEvents:'none' }}>
                <div className="toggle-knob" />
              </div>
              {toggling?'...':online?'🟢 Online':'⚫ Offline'}
            </button>
          </div>
        }
      />
      <div className="page-content">

        {/* Notifications */}
        {notifs.length > 0 && (
          <div style={{ marginBottom:18 }}>
            {notifs.map(n => (
              <div key={n.id} style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:10, padding:'12px 16px', display:'flex', gap:12, alignItems:'center', marginBottom:8 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>🔔</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, fontSize:13 }}>{n.title}</p>
                  <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{n.body}</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => markNotifRead(n.id)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* KYC banners */}
        {kycStatus === 'pending' && (
          <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:18 }}>
            <span style={{ fontSize:20 }}>⚠️</span>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#d97706' }}>KYC Verification Required</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Upload your documents to get verified and start receiving bookings.</p>
            </div>
            <button className="btn btn-sm" style={{ flexShrink:0, background:'rgba(217,119,6,0.1)', color:'#d97706', border:'1px solid rgba(217,119,6,0.3)' }} onClick={() => nav('/provider/kyc')}>Upload →</button>
          </div>
        )}
        {kycStatus === 'submitted' && (
          <div style={{ background:'rgba(37,99,235,0.06)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:18 }}>
            <span style={{ fontSize:20 }}>⏳</span>
            <div>
              <p style={{ fontWeight:700, fontSize:13, color:'#2563eb' }}>KYC Under Review</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Admin will approve within 24 hours. You'll be notified instantly.</p>
            </div>
          </div>
        )}
        {kycStatus === 'verified' && !online && (
          <div style={{ background:'rgba(22,163,74,0.06)', border:'1px solid rgba(22,163,74,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', gap:12, alignItems:'center', marginBottom:18 }}>
            <span style={{ fontSize:20 }}>✅</span>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#16a34a' }}>KYC Verified! Toggle Online to start receiving bookings</p>
              <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>Use the Online button above to receive job requests in {profile?.district}.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          <StatCard icon="💰" iconBg="rgba(249,115,22,0.1)" label="Total Earned"  value={earned>0?'₹'+Math.round(earned).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="📋" iconBg="rgba(22,163,74,0.1)"  label="Total Jobs"    value={String(myJobs.length)} change={todayJobs.length+' today'} up={todayJobs.length>0} />
          <StatCard icon="📩" iconBg="rgba(37,99,235,0.1)"  label="New Requests"  value={String(requests.length)} change={online?'Live':'Go online'} up={online} />
          <StatCard icon="🔐" iconBg="rgba(217,119,6,0.1)"  label="KYC Status"    value={kycStatus==='loading'?'...':kycStatus.charAt(0).toUpperCase()+kycStatus.slice(1)} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
          {/* Live job requests */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <h3 style={{ fontWeight:700, fontSize:14 }}>Job Requests</h3>
                {online && <div className="live-dot" style={{ width:6, height:6 }} />}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                {requests.length>0 && <span className="badge badge-orange">{requests.length} new</span>}
                <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
              </div>
            </div>
            {loading ? (
              <p style={{ color:'var(--text3)', fontSize:13, textAlign:'center', padding:'20px 0' }}>Loading...</p>
            ) : requests.length===0 ? (
              <div style={{ textAlign:'center', padding:'24px 0' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📭</p>
                <p style={{ fontSize:12, color:'var(--text2)' }}>
                  {kycStatus!=='verified'?'Get KYC verified first':!online?'Go online to receive requests':`No requests in ${profile?.district} right now`}
                </p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {requests.map((r:any) => (
                  <div key={r.id} style={{ background:'rgba(249,115,22,0.05)', border:'1.5px solid rgba(249,115,22,0.2)', borderRadius:12, padding:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <span style={{ fontSize:20 }}>{r.category?.icon??'🔧'}</span>
                        <div>
                          <p style={{ fontWeight:700, fontSize:13 }}>{r.category?.name}</p>
                          <p style={{ fontSize:11, color:'var(--text2)', marginTop:1 }}>{r.customer?.full_name} · {r.city}</p>
                        </div>
                      </div>
                      <p style={{ fontWeight:800, fontSize:16, color:'var(--brand)' }}>₹{(r.total_amount||0).toLocaleString('en-IN')}</p>
                    </div>
                    {r.customer_notes && (
                      <p style={{ fontSize:11, color:'var(--text2)', background:'var(--bg2)', borderRadius:6, padding:'5px 8px', marginBottom:8 }}>💬 {r.customer_notes}</p>
                    )}
                    <p style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>📍 {r.address}</p>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn btn-success btn-sm" style={{ flex:1 }} onClick={()=>accept(r.id)}>✓ Accept</button>
                      <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={()=>toast('Declined',{icon:'❌'})}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent jobs */}
          <div className="glass" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Recent Jobs</h3>
              <button className="btn btn-ghost btn-sm" onClick={()=>nav('/provider/myjobs')}>View all →</button>
            </div>
            {myJobs.length===0 ? (
              <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text3)' }}>
                <p style={{ fontSize:28, marginBottom:8 }}>📋</p>
                <p style={{ fontSize:12 }}>Accept your first job request!</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {myJobs.slice(0,5).map((j:any) => (
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
