import { useEffect, useState } from 'react'
import { getAllBookingsAdmin, updateBookingStatus } from '@/services/bookingService'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const TABS = ['All','Pending','Active','Completed','Cancelled']

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('All')
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    getAllBookingsAdmin().then(d => { setBookings(d); setLoading(false) })
  }, [])

  const filtered = bookings.filter(b => {
    const matchTab = tab === 'All' || b.status === tab.toLowerCase()
    const matchSearch = !search ||
      b.booking_ref?.toLowerCase().includes(search.toLowerCase()) ||
      b.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.district?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  async function forceStatus(id: string, status: string) {
    try {
      await updateBookingStatus(id, status)
      setBookings(prev => prev.map(b => b.id===id ? {...b, status} : b))
      toast.success(`Booking marked as ${status}`)
    } catch { toast.error('Failed to update') }
  }

  return (
    <div>
      <PageHeader
        title="All Bookings"
        subtitle={`${bookings.length} total bookings in the system`}
      />
      <div className="page-content">
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <div className="search-wrapper" style={{ flex:1, minWidth:200 }}>
            <span className="search-icon" style={{ fontSize:13 }}>🔍</span>
            <input className="input search-input" placeholder="Search booking ID, customer, district..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="tab-bar">
            {TABS.map(t=><button key={t} className={`tab-item ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
          </div>
        </div>

        {/* Summary chips */}
        <div style={{ display:'flex', gap:10, marginBottom:18, flexWrap:'wrap' }}>
          {['pending','accepted','active','completed','cancelled'].map(s => {
            const count = bookings.filter(b=>b.status===s).length
            if (!count) return null
            return (
              <div key={s} onClick={()=>setTab(s.charAt(0).toUpperCase()+s.slice(1))}
                style={{ padding:'5px 12px', borderRadius:20, background:'var(--bg2)', border:'1px solid var(--border)', fontSize:12, cursor:'pointer', fontWeight:600 }}>
                <StatusBadge status={s} /> <span style={{ marginLeft:6, color:'var(--text2)' }}>{count}</span>
              </div>
            )
          })}
        </div>

        <div className="glass" style={{ overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading all bookings...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center' }}>
              <p style={{ fontSize:36, marginBottom:10 }}>📋</p>
              <p style={{ color:'var(--text2)' }}>No bookings found</p>
              <p style={{ color:'var(--text3)', fontSize:12, marginTop:6 }}>Bookings appear here in real-time when customers place orders</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Provider</th><th>District</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((b:any) => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:11, color:'var(--text2)' }}>{b.booking_ref}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:26, height:26, borderRadius:'50%', background:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', flexShrink:0 }}>
                          {b.customer?.full_name?.[0]??'U'}
                        </div>
                        <div>
                          <p style={{ fontSize:12, fontWeight:600 }}>{b.customer?.full_name??'—'}</p>
                          <p style={{ fontSize:10, color:'var(--text3)' }}>{b.customer?.phone??''}</p>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ marginRight:6 }}>{b.category?.icon}</span>{b.category?.name??'—'}</td>
                    <td style={{ color:'var(--text2)', fontSize:12 }}>
                      {b.provider?.profile?.full_name ?? <span style={{ color:'#d97706', fontStyle:'italic' }}>Unassigned</span>}
                    </td>
                    <td style={{ color:'var(--text2)', fontSize:12 }}>{b.district}</td>
                    <td style={{ fontWeight:700 }}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                    <td style={{ color:'var(--text2)', fontSize:11 }}>
                      {new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        {b.status==='pending' && (
                          <button className="btn btn-danger btn-sm" onClick={()=>forceStatus(b.id,'cancelled')}>Cancel</button>
                        )}
                        {b.status==='accepted' && (
                          <button className="btn btn-success btn-sm" onClick={()=>forceStatus(b.id,'completed')}>Complete</button>
                        )}
                        {b.status==='completed' && (
                          <span style={{ fontSize:11, color:'#16a34a' }}>✓ Done</span>
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
