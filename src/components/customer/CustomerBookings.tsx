import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { getCustomerBookings, updateBookingStatus } from '@/services/bookingService'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const TABS = ['All','Active','Completed','Cancelled']

export default function CustomerBookings() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('All')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    if (!profile?.id) return
    getCustomerBookings(profile.id).then(d => { setBookings(d); setLoading(false) })
  }, [profile?.id])

  const filtered = bookings.filter(b => {
    const matchTab =
      tab === 'All' ||
      (tab === 'Active'    && (b.status==='active'||b.status==='accepted')) ||
      (tab === 'Completed' && b.status==='completed') ||
      (tab === 'Cancelled' && b.status==='cancelled')
    const matchSearch = !search ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.name?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  async function cancel(id: string) {
    try {
      await updateBookingStatus(id, 'cancelled')
      setBookings(prev => prev.map(b => b.id===id ? {...b,status:'cancelled'} : b))
      toast.success('Booking cancelled')
    } catch { toast.error('Failed to cancel') }
  }

  return (
    <div>
      <PageHeader title="My Bookings" subtitle={`${bookings.length} total bookings`} />
      <div className="page-content">
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <div className="search-wrapper" style={{ flex:1, minWidth:180 }}>
            <span className="search-icon" style={{ fontSize:13 }}>🔍</span>
            <input className="input search-input" placeholder="Search bookings..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="tab-bar">
            {TABS.map(t=><button key={t} className={`tab-item ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
          </div>
        </div>

        <div className="glass" style={{ overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading bookings...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center' }}>
              <p style={{ fontSize:36, marginBottom:10 }}>📋</p>
              <p style={{ color:'var(--text2)', fontSize:14, marginBottom:14 }}>
                {bookings.length === 0 ? 'No bookings yet' : 'No bookings match this filter'}
              </p>
              {bookings.length === 0 && (
                <button className="btn btn-brand btn-sm" onClick={()=>nav('/dashboard/book')}>Book your first service</button>
              )}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Booking ID</th><th>Service</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map((b:any) => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:11, color:'var(--text2)' }}>{b.booking_ref}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:17 }}>{b.category?.icon ?? '🔧'}</span>
                        <span style={{ fontWeight:500 }}>{b.category?.name ?? 'Service'}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--text2)', fontSize:12 }}>
                      {new Date(b.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td style={{ fontWeight:700 }}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {(b.status==='active'||b.status==='accepted') && (
                          <button className="btn btn-brand btn-sm" onClick={()=>nav('/dashboard/track')}>Track</button>
                        )}
                        {b.status==='pending' && (
                          <button className="btn btn-danger btn-sm" onClick={()=>cancel(b.id)}>Cancel</button>
                        )}
                        {b.status==='completed' && (
                          <button className="btn btn-outline btn-sm">Review</button>
                        )}
                        {b.status==='cancelled' && (
                          <button className="btn btn-outline btn-sm" onClick={()=>nav('/dashboard/book')}>Rebook</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
