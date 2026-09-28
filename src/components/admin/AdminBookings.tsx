import { useState, useEffect } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Avatar from '@/components/ui/Avatar'

export default function AdminBookings() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [assignModal, setAssignModal] = useState<{ isOpen: boolean, booking: any }>({ isOpen: false, booking: null })
  const [providers, setProviders] = useState<any[]>([])
  const [loadingProvs, setLoadingProvs] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  useEffect(() => { fetchBookings() }, [])

  async function fetchBookings() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_ref, status, total_amount, created_at, district, category_id, city, address,
          customer:profiles!bookings_customer_id_fkey(full_name, phone),
          provider:profiles!bookings_provider_id_fkey(full_name, phone),
          category:service_categories(name)
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      setBookings(data || [])
    } catch (err: any) {
      toast.error('Failed to load bookings: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function openAssignModal(booking: any) {
    setAssignModal({ isOpen: true, booking })
    setLoadingProvs(true)
    setProviders([])
    try {
      // Fetch verified providers matching the booking district and category
      const { data, error } = await supabase
        .from('providers')
        .select(`
          id, rating, total_jobs, experience_years,
          profile:profiles!inner(full_name, phone, district)
        `)
        .eq('kyc_status', 'verified')
        // We can optionally filter by category_id or district
      
      if (error) throw error
      
      // Filter in frontend to handle case insensitive district matching
      const norm = (s?: string) => (s ?? '').trim().toLowerCase()
      const matching = (data || []).filter(p => norm(p.profile?.district) === norm(booking.district))
      
      setProviders(matching)
    } catch (err: any) {
      toast.error('Failed to load providers: ' + err.message)
    } finally {
      setLoadingProvs(false)
    }
  }

  async function assignProvider(providerId: string) {
    if (!assignModal.booking) return
    setAssigningId(providerId)
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          provider_id: providerId, 
          status: 'provider_assigned' 
        })
        .eq('id', assignModal.booking.id)
      
      if (error) throw error
      toast.success('Provider assigned successfully!')
      setAssignModal({ isOpen: false, booking: null })
      fetchBookings()
    } catch (err: any) {
      toast.error('Assignment failed: ' + err.message)
    } finally {
      setAssigningId(null)
    }
  }

  const TABS = ['All', 'Pending Assignment', 'Provider Assigned', 'Payment Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']
  
  const mapFilter = (t: string) => {
    switch (t) {
      case 'Pending Assignment': return 'pending_admin'
      case 'Provider Assigned': return 'provider_assigned'
      case 'Payment Pending': return 'payment_pending'
      case 'Confirmed': return 'confirmed'
      case 'In Progress': return 'in_progress'
      default: return t.toLowerCase()
    }
  }

  const filtered = bookings.filter(b => {
    const filterKey = mapFilter(filter)
    const matchF = filter === 'All' || b.status === filterKey
    const refMatch = b.booking_ref?.toLowerCase().includes(search.toLowerCase())
    const custMatch = b.customer?.full_name?.toLowerCase().includes(search.toLowerCase())
    const provMatch = b.provider?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchS = !search || refMatch || custMatch || provMatch
    return matchF && matchS
  })

  return (
    <div>
      <PageHeader title="All Bookings" subtitle="Platform-wide booking management" />
      <div className="page-content">
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <div className="search-wrapper" style={{flex:1,minWidth:200}}>
            <span className="search-icon" style={{fontSize:14}}>🔍</span>
            <input className="input search-input" placeholder="Search ID or customer…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
        </div>
        <div className="tab-bar" style={{marginBottom: 20, overflowX: 'auto', whiteSpace: 'nowrap'}}>
          {TABS.map(t=><button key={t} className={`tab-item ${filter===t?'active':''}`} onClick={()=>setFilter(t)}>{t}</button>)}
        </div>

        <div className="glass" style={{overflow:'hidden'}}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Provider</th>
                <th>District</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{textAlign:'center', padding:40}}>Loading bookings...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{textAlign:'center', padding:40, color:'var(--text2)'}}>No bookings found.</td></tr>
              ) : filtered.map(b=>(
                <tr key={b.id}>
                  <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)'}}>{b.booking_ref}</span></td>
                  <td style={{fontWeight:500}}>
                    {b.customer?.full_name}<br/>
                    <span style={{fontSize: 11, color:'var(--text2)', fontWeight:400}}>{b.customer?.phone}</span>
                  </td>
                  <td>{b.category?.name || 'Service'}</td>
                  <td style={{color:!b.provider?'#d97706':'var(--text)',fontStyle:!b.provider?'italic':''}}>
                    {b.provider?.full_name || 'Unassigned'}
                  </td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{b.district}</td>
                  <td style={{fontWeight:700}}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    {b.status === 'pending_admin' ? (
                      <button className="btn btn-brand btn-sm" onClick={() => openAssignModal(b)}>Assign Provider</button>
                    ) : (
                      <div style={{display:'flex', gap:6}}>
                        <button className="btn btn-outline btn-sm">View</button>
                        {b.provider && (
                          <button className="btn btn-outline btn-sm" onClick={() => openAssignModal(b)}>Change</button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {assignModal.isOpen && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
          <div className="glass" style={{background:'var(--bg)', width:'100%', maxWidth:600, borderRadius:16, padding:24, maxHeight:'90vh', display:'flex', flexDirection:'column'}}>
            <h3 style={{fontWeight:700, fontSize:18, marginBottom:8}}>Assign Provider</h3>
            <p style={{fontSize:13, color:'var(--text2)', marginBottom:20}}>
              Booking <strong>{assignModal.booking?.booking_ref}</strong> in <strong>{assignModal.booking?.district}</strong>
            </p>

            <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:12}}>
              {loadingProvs ? (
                <div style={{textAlign:'center', padding:40}}>Loading available providers...</div>
              ) : providers.length === 0 ? (
                <div style={{textAlign:'center', padding:40, color:'var(--text2)'}}>
                  No verified providers found in {assignModal.booking?.district}.
                </div>
              ) : (
                providers.map(p => (
                  <div key={p.id} style={{display:'flex', alignItems:'center', gap:14, padding:16, border:'1px solid var(--border)', borderRadius:12}}>
                    <Avatar name={p.profile?.full_name} size={40} />
                    <div style={{flex:1}}>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span style={{fontWeight:600, fontSize:14}}>{p.profile?.full_name}</span>
                        <span className="badge badge-green" style={{fontSize:10}}>Verified</span>
                      </div>
                      <p style={{fontSize:12, color:'var(--text2)', marginTop:4}}>
                        ★{p.rating>0?Number(p.rating).toFixed(1):'New'} · {p.total_jobs} jobs · {p.experience_years}+ yrs
                      </p>
                      <p style={{fontSize:11, color:'var(--text3)'}}>{p.profile?.phone}</p>
                    </div>
                    <button 
                      className="btn btn-brand"
                      disabled={assigningId === p.id}
                      onClick={() => assignProvider(p.id)}
                    >
                      {assigningId === p.id ? 'Assigning...' : 'Assign'}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div style={{marginTop:20, borderTop:'1px solid var(--border)', paddingTop:16, textAlign:'right'}}>
              <button className="btn btn-outline" onClick={() => setAssignModal({isOpen:false, booking:null})}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
