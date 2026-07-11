import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getAvailableBookings, getProviderBookings, acceptBooking } from '@/services/bookingService'
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
  const [kycStatus, setKycStatus] = useState<string>('loading')
  const [loading,   setLoading]   = useState(true)
  const first = profile?.full_name?.split(' ')[0] ?? 'Provider'

  const load = useCallback(async () => {
    if (!profile?.id) return
    const district = profile.district || 'Bengaluru Urban'

    // Fetch provider's OWN row directly — must succeed for KYC status
    const { data: provRow, error: provErr } = await supabase
      .from('providers')
      .select('kyc_status, is_online')
      .eq('id', profile.id)
      .maybeSingle()

    if (provErr) {
      console.error('Provider row fetch error:', provErr)
      // Could be RLS blocking — run fix_provider_rls.sql in Supabase
      setKycStatus('pending')
    } else if (!provRow) {
      // No providers row at all — treat as pending
      setKycStatus('pending')
      setOnline(false)
    } else {
      setKycStatus(provRow.kyc_status ?? 'pending')
      setOnline(provRow.is_online ?? false)
    }

    const [reqs, jobs] = await Promise.all([
      getAvailableBookings(district),
      getProviderBookings(profile.id),
    ])
    setRequests(reqs)
    setMyJobs(jobs)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  // Realtime subscription — reload when bookings change
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase.channel('provider-home-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load)
      // Also listen for changes to providers table (so KYC approval reflects immediately)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'providers', filter: `id=eq.${profile.id}` }, (payload) => {
        const newStatus = (payload.new as any)?.kyc_status
        const newOnline = (payload.new as any)?.is_online
        if (newStatus) setKycStatus(newStatus)
        if (typeof newOnline === 'boolean') setOnline(newOnline)
        if (newStatus === 'verified') {
          toast.success('🎉 Your KYC has been approved! You can now go online.')
        }
      })
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [profile?.id, load])

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
      // Upsert handles case where providers row might not exist
      const { error } = await supabase
        .from('providers')
        .upsert({ id: profile.id, is_online: next }, { onConflict: 'id' })
      if (error) throw error
      setOnline(next)
      toast.success(next ? '🟢 You are Online! Receiving job requests.' : '⚫ You are Offline.')
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message)
    } finally {
      setToggling(false) 
    }
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

  const earned    = myJobs.filter(j => j.status === 'completed').reduce((s, j) => s + (j.total_amount||0)*0.9, 0)
  const todayJobs = myJobs.filter(j => new Date(j.created_at).toDateString() === new Date().toDateString())

  const kycBanner = () => {
    if (kycStatus === 'loading') return null
    if (kycStatus === 'verified' && online) return null // no banner needed when everything is good

    const banners: Record<string, { bg: string; border: string; icon: string; color: string; title: string; body: string; cta?: { label: string; action: () => void } }> = {
      pending: {
        bg: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)', icon: '⚠️', color: '#d97706',
        title: 'KYC Verification Required',
        body: 'Upload your Aadhaar, selfie, skill certificate and bank passbook to get verified.',
        cta: { label: 'Upload Documents →', action: () => nav('/provider/kyc') }
      },
      submitted: {
        bg: 'rgba(37,99,235,0.06)', border: 'rgba(37,99,235,0.2)', icon: '⏳', color: '#2563eb',
        title: 'KYC Under Review',
        body: 'Your documents have been submitted. Admin will approve within 24 hours. You will be notified.',
      },
      rejected: {
        bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.2)', icon: '❌', color: '#dc2626',
        title: 'KYC Rejected',
        body: 'Your documents were rejected. Please re-upload clear, readable documents.',
        cta: { label: 'Re-upload →', action: () => nav('/provider/kyc') }
      },
      verified: {
        bg: 'rgba(22,163,74,0.06)', border: 'rgba(22,163,74,0.2)', icon: '✅', color: '#16a34a',
        title: 'KYC Verified! Toggle Online to receive bookings',
        body: `Go online using the button above to start receiving job requests in ${profile?.district || 'your district'}.`,
      },
    }

    const b = banners[kycStatus]
    if (!b) return null

    return (
      <div style={{ background: b.bg, border: `1px solid ${b.border}`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{b.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: b.color }}>{b.title}</p>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{b.body}</p>
        </div>
        {b.cta && (
          <button className="btn btn-sm" style={{ flexShrink: 0, background: b.bg, color: b.color, border: `1px solid ${b.border}` }} onClick={b.cta.action}>
            {b.cta.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${first} 👷`}
        subtitle={`${profile?.district || 'Karnataka'} · Provider Dashboard`}
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* KYC status pill */}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: kycStatus==='verified'?'rgba(22,163,74,0.1)':kycStatus==='submitted'?'rgba(37,99,235,0.1)':'rgba(217,119,6,0.1)',
              color: kycStatus==='verified'?'#16a34a':kycStatus==='submitted'?'#2563eb':'#d97706',
              border: `1px solid ${kycStatus==='verified'?'rgba(22,163,74,0.3)':kycStatus==='submitted'?'rgba(37,99,235,0.3)':'rgba(217,119,6,0.3)'}`,
              textTransform: 'capitalize' as const,
            }}>
              KYC: {kycStatus === 'loading' ? '...' : kycStatus}
            </span>

            {/* Online toggle — only enabled when verified */}
            <button
              onClick={toggleOnline}
              disabled={toggling || kycStatus !== 'verified'}
              title={kycStatus !== 'verified' ? 'Complete KYC verification first' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 18px', borderRadius: 10,
                border: `1.5px solid ${online ? 'rgba(22,163,74,0.4)' : 'var(--border)'}`,
                background: online ? 'rgba(22,163,74,0.08)' : 'var(--bg2)',
                cursor: kycStatus === 'verified' ? 'pointer' : 'not-allowed',
                opacity: kycStatus === 'verified' ? 1 : 0.5,
                fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 13,
                color: online ? '#16a34a' : 'var(--text2)',
                transition: 'all 0.2s',
              }}>
              <div className={`toggle ${online?'on':''}`} style={{ pointerEvents: 'none' }}>
                <div className="toggle-knob" />
              </div>
              {toggling ? '...' : online ? '🟢 Online' : '⚫ Offline'}
            </button>
          </div>
        }
      />
      <div className="page-content">
        {kycBanner()}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
          <StatCard icon="💰" iconBg="rgba(249,115,22,0.1)" label="Total Earned"  value={earned>0?'₹'+Math.round(earned).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="📋" iconBg="rgba(22,163,74,0.1)"  label="Total Jobs"    value={String(myJobs.length)} change={todayJobs.length+' today'} up={todayJobs.length>0} />
          <StatCard icon="📩" iconBg="rgba(37,99,235,0.1)"  label="New Requests"  value={String(requests.length)} change={online?'Receiving':'Go online'} up={online} />
          <StatCard icon="🔐" iconBg="rgba(217,119,6,0.1)"  label="KYC Status"    value={kycStatus==='loading'?'...':kycStatus.charAt(0).toUpperCase()+kycStatus.slice(1)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* Live Requests */}
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14 }}>Job Requests</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {requests.length > 0 && <span className="badge badge-orange">{requests.length} new</span>}
                <button className="btn btn-ghost btn-sm" onClick={load}>↻</button>
              </div>
            </div>
            {loading ? (
              <p style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Loading...</p>
            ) : requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📭</p>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {kycStatus !== 'verified' ? 'Get KYC verified to receive requests' : !online ? 'Go online to receive requests' : `No requests in ${profile?.district || 'your area'} right now`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.slice(0, 3).map((r: any) => (
                  <div key={r.id} style={{ background: 'rgba(249,115,22,0.05)', border: '1.5px solid rgba(249,115,22,0.2)', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 20 }}>{r.category?.icon ?? '🔧'}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 13 }}>{r.category?.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 1 }}>{r.customer?.full_name} · {r.city}</p>
                        </div>
                      </div>
                      <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--brand)', flexShrink: 0 }}>₹{r.total_amount?.toLocaleString('en-IN')}</p>
                    </div>
                    {r.customer_notes && (
                      <p style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg2)', borderRadius: 6, padding: '5px 8px', marginBottom: 8 }}>
                        💬 {r.customer_notes}
                      </p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>📍 {r.address}</p>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleAccept(r.id)}>✓ Accept</button>
                      <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => toast('Declined', { icon: '❌' })}>Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent jobs */}
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: 14 }}>Recent Jobs</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => nav('/provider/myjobs')}>View all →</button>
            </div>
            {myJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>📋</p>
                <p style={{ fontSize: 12 }}>No jobs yet. Accept your first request!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {myJobs.slice(0, 5).map((j: any) => (
                  <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{j.category?.icon ?? '🔧'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {j.customer?.full_name} — {j.category?.name}
                      </p>
                      <p style={{ fontSize: 10, color: 'var(--text2)', marginTop: 1 }}>
                        {new Date(j.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>₹{Math.round((j.total_amount||0)*0.9).toLocaleString('en-IN')}</p>
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
