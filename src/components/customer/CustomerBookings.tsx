import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'

const ALL_BOOKINGS = [
  {id:'PS-2847',svc:'Plumbing Service',   icon:'🔧',provider:'Suresh Kumar',   date:'Today 2:30 PM',  amount:719,  status:'active'},
  {id:'PS-2841',svc:'Electrical Work',    icon:'⚡',provider:'Mahesh Reddy',   date:'Jun 14, 2025',   amount:1240, status:'completed'},
  {id:'PS-2830',svc:'Tata Ace Transport', icon:'🚐',provider:'Ravi Transport',  date:'Jun 10, 2025',   amount:899,  status:'completed'},
  {id:'PS-2821',svc:'Home Cleaning',      icon:'🧹',provider:'Meena Devi',     date:'Jun 8, 2025',    amount:480,  status:'completed'},
  {id:'PS-2810',svc:'Mason Work',         icon:'🧱',provider:'Ramesh Gowda',   date:'Jun 5, 2025',    amount:2100, status:'completed'},
  {id:'PS-2805',svc:'JCB Excavator',      icon:'🏗️',provider:'Kumar Excavators',date:'Jun 3, 2025',   amount:4500, status:'cancelled'},
  {id:'PS-2798',svc:'Driver',             icon:'🚗',provider:'Ahmed Khan',     date:'May 28, 2025',   amount:700,  status:'completed'},
  {id:'PS-2789',svc:'Loading / Unloading',icon:'💪',provider:'Basappa Naik',   date:'May 20, 2025',   amount:600,  status:'completed'},
]

const TABS = ['All','Active','Completed','Cancelled']

export default function CustomerBookings() {
  const [tab, setTab] = useState('All')
  const [search, setSearch] = useState('')
  const nav = useNavigate()

  const filtered = ALL_BOOKINGS.filter(b => {
    const matchTab = tab==='All' || (tab==='Active'&&(b.status==='active'||b.status==='accepted')) || b.status===tab.toLowerCase()
    const matchSearch = search==='' || b.id.toLowerCase().includes(search.toLowerCase()) || b.svc.toLowerCase().includes(search.toLowerCase()) || b.provider.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  return (
    <div>
      <PageHeader title="My Bookings" subtitle={`${ALL_BOOKINGS.length} total bookings`} />
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
              {filtered.length===0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'48px',color:'var(--text3)'}}>No bookings found</td></tr>
              ) : filtered.map(b=>(
                <tr key={b.id}>
                  <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)'}}>{b.id}</span></td>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}><span style={{fontSize:18}}>{b.icon}</span><span style={{fontWeight:500}}>{b.svc}</span></div></td>
                  <td style={{color:'var(--text2)'}}>{b.provider}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{b.date}</td>
                  <td style={{fontWeight:700}}>₹{b.amount.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      {(b.status==='active'||b.status==='accepted') && (
                        <button className="btn btn-brand btn-sm" onClick={()=>nav('/dashboard/track')}>Track</button>
                      )}
                      {b.status==='completed' && (
                        <button className="btn btn-outline btn-sm">Review</button>
                      )}
                      {b.status==='cancelled' && (
                        <button className="btn btn-outline btn-sm">Rebook</button>
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
