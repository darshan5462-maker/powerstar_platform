import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getProviderBookings, getAvailableBookings, acceptBooking, declineBooking, completeProviderBooking } from '@/services/bookingService'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function ProviderJobs({ myJobs = false }: { myJobs?: boolean }) {
  const { profile } = useAuthStore()
  const [data,    setData]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    setError(null)
    try {
      const rows = myJobs
        ? await getProviderBookings(profile.id)
        : await getAvailableBookings(profile.district || 'Bengaluru Urban')
      setData(rows)
    } catch {
      setError('Jobs could not be loaded right now.')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [profile?.id, profile?.district, myJobs])

  useEffect(() => { void load() }, [load])

  async function accept(bookingId: string) {
    if (!profile?.id) return
    try {
      await acceptBooking(bookingId, profile.id)
      setData(prev => prev.filter(r => r.id !== bookingId))
      toast.success('Job accepted! Navigate to customer location.')
    } catch { toast.error('Failed to accept — booking may have been taken') }
  }

  async function complete(bookingId: string) {
    if (!profile?.id || !window.confirm('Mark this job as completed?')) return
    try {
      await completeProviderBooking(bookingId, profile.id)
      setData(prev => prev.map(j => j.id===bookingId ? { ...j, status:'completed' } : j))
      toast.success('Job completed! Payment will be settled in 24 hrs.')
    } catch (err: any) { toast.error(err?.message || 'Failed to update status') }
  }

  async function decline(bookingId: string) {
    if (!profile?.id || !window.confirm('Decline this request? It will be released from your request list.')) return
    try {
      await declineBooking(bookingId, profile.id)
      setData(prev => prev.filter(row => row.id !== bookingId))
      toast.success('Request declined')
    } catch (err: any) { toast.error(err?.message || 'Request is no longer available') }
  }

  return (
    <div>
      <PageHeader
        title={myJobs ? 'My Jobs' : 'Job Requests'}
        subtitle={myJobs
          ? `${data.length} total jobs in your history`
          : `New requests in ${profile?.district || 'your district'}`}
        action={<button className="btn btn-outline btn-sm" onClick={() => void load()} disabled={loading}>↻ Refresh</button>}
      />
      <div className="page-content">
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading...</div>
        ) : error ? (
          <div className="glass" style={{ padding:48, textAlign:'center' }} role="alert">
            <p style={{ fontSize:30, marginBottom:10 }}>⚠️</p>
            <p style={{ fontWeight:600, marginBottom:12 }}>{error}</p>
            <button className="btn btn-outline btn-sm" onClick={() => void load()}>Try again</button>
          </div>
        ) : data.length === 0 ? (
          <div className="glass" style={{ padding:48, textAlign:'center' }}>
            <p style={{ fontSize:36, marginBottom:10 }}>{myJobs ? '📋' : '📭'}</p>
            <p style={{ fontWeight:600, marginBottom:6 }}>{myJobs ? 'No jobs yet' : 'No requests right now'}</p>
            <p style={{ color:'var(--text2)', fontSize:13 }}>
              {myJobs ? 'Accept job requests to see your job history here.' : 'Stay online to receive job requests from your district.'}
            </p>
          </div>
        ) : myJobs ? (
          <div className="glass provider-jobs-history" style={{ overflow:'hidden', minWidth:0 }}>
            <div className="provider-desktop-table">
              <table className="data-table">
                <thead>
                  <tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Date</th><th>Earned</th><th>Status</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {data.map((j: any) => (
                    <tr key={j.id}>
                      <td><span style={{ fontFamily:'monospace', fontSize:11, color:'var(--text2)' }}>{j.booking_ref}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Avatar name={j.customer?.full_name ?? 'C'} size={26} />
                          <span style={{ fontWeight:500 }}>{j.customer?.full_name ?? '—'}</span>
                        </div>
                      </td>
                      <td><span style={{ marginRight:5 }}>{j.category?.icon}</span>{j.category?.name}</td>
                      <td style={{ color:'var(--text2)', fontSize:12 }}>
                        {new Date(j.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                      </td>
                      <td style={{ fontWeight:700, color:'var(--brand)' }}>
                        ₹{Math.round((j.total_amount||0)*0.9).toLocaleString('en-IN')}
                      </td>
                      <td><StatusBadge status={j.status} /></td>
                      <td>
                        {j.status === 'accepted' && (
                          <button className="btn btn-success btn-sm" onClick={() => complete(j.id)}>Mark Complete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="provider-mobile-job-list">
              {data.map((j: any) => (
                <article className="provider-mobile-job-card" key={j.id}>
                  <div className="provider-mobile-job-heading">
                    <div className="provider-mobile-job-customer">
                      <Avatar name={j.customer?.full_name ?? 'C'} size={34} />
                      <div>
                        <p className="provider-mobile-job-name">{j.customer?.full_name ?? '—'}</p>
                        <p className="provider-mobile-job-ref">{j.booking_ref}</p>
                      </div>
                    </div>
                    <StatusBadge status={j.status} />
                  </div>
                  <div className="provider-mobile-job-meta">
                    <span><strong>Service</strong>{j.category?.icon ?? '🔧'} {j.category?.name ?? 'Service'}</span>
                    <span><strong>Date</strong>{new Date(j.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                  </div>
                  <div className="provider-mobile-job-footer">
                    <span className="provider-mobile-job-amount">₹{Math.round((j.total_amount||0)*0.9).toLocaleString('en-IN')} earned</span>
                    {j.status === 'accepted' && <button className="btn btn-success btn-sm" onClick={() => complete(j.id)}>Mark Complete</button>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:660 }}>
            {data.map((r: any) => (
              <div key={r.id} className="glass" style={{ padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                    <span style={{ fontSize:28 }}>{r.category?.icon ?? '🔧'}</span>
                    <div>
                      <p style={{ fontWeight:700, fontSize:15 }}>{r.category?.name} Service</p>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                        <Avatar name={r.customer?.full_name ?? 'C'} size={18} />
                        <p style={{ fontSize:12, color:'var(--text2)' }}>{r.customer?.full_name} · {r.city}</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontWeight:800, fontSize:22, color:'var(--brand)' }}>₹{(r.total_amount||0).toLocaleString('en-IN')}</p>
                    <p style={{ fontSize:11, color:'var(--text3)' }}>You get ₹{Math.round((r.total_amount||0)*0.9).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                <div style={{ display:'flex', gap:16, fontSize:12, color:'var(--text2)', marginBottom:10, flexWrap:'wrap' }}>
                  <span>📍 {r.address}, {r.district}</span>
                  <span>🕒 {new Date(r.created_at).toLocaleTimeString('en-IN',{ hour:'2-digit', minute:'2-digit' })}</span>
                </div>
                {r.customer_notes && (
                  <div style={{ background:'var(--bg2)', borderRadius:8, padding:'8px 12px', fontSize:12, color:'var(--text2)', marginBottom:12 }}>
                    💬 "{r.customer_notes}"
                  </div>
                )}
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-success" style={{ flex:2 }} onClick={() => accept(r.id)}>✓ Accept Job</button>
                  <button className="btn btn-outline" style={{ flex:1 }} onClick={() => void decline(r.id)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
