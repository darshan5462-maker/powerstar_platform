import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { useNavigate } from 'react-router-dom'

const BOOKINGS = [
  {ref:'PS-28470',customer:'Ramesh Kumar',svc:'🔧 Plumbing', provider:'Suresh Kumar',district:'Bengaluru',amount:719,  status:'active',   date:'Today'},
  {ref:'PS-28460',customer:'Anitha Rao',  svc:'⚡ Electrical',provider:'Mahesh R.',   district:'Mysuru',    amount:1240, status:'completed', date:'Jun 14'},
  {ref:'PS-28450',customer:'Sunil Gowda', svc:'🚐 Tata Ace', provider:'Ravi T.',      district:'Hubballi',  amount:899,  status:'completed', date:'Jun 10'},
  {ref:'PS-28440',customer:'Meena Devi',  svc:'🧱 Mason',    provider:'Unassigned',   district:'Mangaluru', amount:2100, status:'pending',   date:'Jun 9'},
  {ref:'PS-28430',customer:'Priya Sharma',svc:'🧹 Cleaning', provider:'Lakshmi K.',   district:'Belagavi',  amount:480,  status:'completed', date:'Jun 8'},
  {ref:'PS-28420',customer:'Ahmed Khan',  svc:'🏗️ JCB',      provider:'Kumar Ex.',    district:'Davangere', amount:4500, status:'cancelled', date:'Jun 7'},
  {ref:'PS-28410',customer:'Kavitha M.',  svc:'🚗 Driver',   provider:'Ahmed D.',     district:'Bengaluru', amount:700,  status:'completed', date:'Jun 6'},
  {ref:'PS-28400',customer:'Basappa G.',  svc:'💪 Loading',  provider:'Naik Group',   district:'Ballari',   amount:600,  status:'completed', date:'Jun 5'},
]

export default function AdminBookings() {
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const nav = useNavigate()

  const filtered = BOOKINGS.filter(b => {
    const matchF = filter==='All' || b.status===filter.toLowerCase() || (filter==='Active'&&(b.status==='active'||b.status==='accepted'))
    const matchS = !search || b.ref.toLowerCase().includes(search.toLowerCase()) || b.customer.toLowerCase().includes(search.toLowerCase())
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
          <div className="tab-bar">
            {['All','Active','Pending','Completed','Cancelled'].map(t=><button key={t} className={`tab-item ${filter===t?'active':''}`} onClick={()=>setFilter(t)}>{t}</button>)}
          </div>
        </div>
        <div className="glass" style={{overflow:'hidden'}}>
          <table className="data-table">
            <thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Provider</th><th>District</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map(b=>(
                <tr key={b.ref}>
                  <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)'}}>{b.ref}</span></td>
                  <td style={{fontWeight:500}}>{b.customer}</td>
                  <td>{b.svc}</td>
                  <td style={{color:b.provider==='Unassigned'?'#d97706':'var(--text2)',fontStyle:b.provider==='Unassigned'?'italic':''}}>{b.provider}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{b.district}</td>
                  <td style={{fontWeight:700}}>₹{b.amount.toLocaleString('en-IN')}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{b.date}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td><button className="btn btn-outline btn-sm" onClick={()=>{}}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
