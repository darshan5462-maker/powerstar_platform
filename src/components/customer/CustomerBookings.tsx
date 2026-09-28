import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

const TABS = ['All','Active','Completed','Cancelled']

export default function CustomerBookings() {
  const { profile } = useAuthStore()
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (profile?.id) {
      supabase
        .from('bookings')
        .select(`
          *,
          category:service_categories(name, icon),
          provider:profiles!bookings_provider_id_fkey(full_name)
        `)
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setBookings(data ?? [])
          setLoading(false)
        })
    }
  }, [profile?.id])

  const filtered = bookings.filter(b => {
    const activeStatuses = ['pending_admin','provider_assigned','payment_pending','payment_success','confirmed','in_progress']
    const matchTab = tab==='All' || (tab==='Active' && activeStatuses.includes(b.status)) || b.status===tab.toLowerCase()
    
    const idMatch = b.booking_ref?.toLowerCase().includes(search.toLowerCase())
    const svcMatch = b.category?.name?.toLowerCase().includes(search.toLowerCase())
    const provMatch = b.provider?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchSearch = search==='' || idMatch || svcMatch || provMatch
    return matchTab && matchSearch
  })

  return (
    <div>
      <PageHeader title="My Bookings" subtitle={`${bookings.length} total bookings`} />
      <div className="page-content">
        <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
          <div className="search-wrapper" style={{flex:1,minWidth:200}}>
            <span className="search-icon" style={{fontSize:14}}>🔍</span>
            <input className="input search-input" placeholder="Search bookings…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="tab-bar" style={{flexShrink:0}}>
            {TABS.map(t=><button key={t} className={`tab-item ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>)}
          </div>
        </div>

        <div className="glass" style={{overflow:'hidden'}}>
          <table className="data-table">
            <thead>
              <tr><th>Booking ID</th><th>Service</th><th>Provider</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'48px',color:'var(--text3)'}}>Loading bookings...</td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'48px',color:'var(--text3)'}}>No bookings found</td></tr>
              ) : filtered.map(b=>(
                <tr key={b.id}>
                  <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)'}}>{b.booking_ref}</span></td>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:18}}>{b.category?.icon}</span><span style={{fontWeight:500}}>{b.category?.name}</span></div></td>
                  <td style={{color:!b.provider?'#d97706':'var(--text2)',fontStyle:!b.provider?'italic':''}}>
                    {b.provider?.full_name || 'Unassigned'}
                  </td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td style={{fontWeight:700}}>₹{b.total_amount?.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      {['pending_admin','provider_assigned','payment_pending','payment_success','confirmed','in_progress'].includes(b.status) && (
                        <button className="btn btn-brand btn-sm" onClick={()=>nav('/dashboard/track')}>Track</button>
                      )}
                      {b.status==='completed' && (
                        <button className="btn btn-outline btn-sm">Review</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
