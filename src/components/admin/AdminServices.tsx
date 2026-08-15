import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { ALL_SERVICES, PROVIDER_COUNTS } from '@/data/services'
import toast from 'react-hot-toast'

export default function AdminServices() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = ALL_SERVICES.filter(s =>
    (typeFilter==='all' || s.type===typeFilter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = ALL_SERVICES.reduce((acc,s) => { acc[s.type]=(acc[s.type]||0)+1; return acc }, {} as Record<string,number>)

  return (
    <div>
      <PageHeader
        title="Service Categories"
        subtitle={`${ALL_SERVICES.length} total services across all categories`}
        action={<button className="btn btn-brand btn-sm" onClick={()=>toast('Add category — connect to DB',{icon:'💡'})}>+ Add Category</button>}
      />
      <div className="page-content">
        {/* Type summary */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
          {[['manpower','👷','Manpower','#f97316'],['vehicle','🚛','Vehicles','#2563eb'],['rto','📋','RTO','#16a34a'],['financial','💰','Financial','#d97706']].map(([t,icon,label,color])=>(
            <div key={t} className="glass" style={{padding:'14px 18px',cursor:'pointer',borderColor:typeFilter===t?color:'var(--border)'}} onClick={()=>setTypeFilter(typeFilter===t?'all':t as string)}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:22}}>{icon}</span>
                <div>
                  <p style={{fontSize:12,color:'var(--text2)'}}>{label}</p>
                  <p style={{fontSize:20,fontWeight:800,color:color as string,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{counts[t as string]||0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:12,marginBottom:20}}>
          <div className="search-wrapper" style={{flex:1,maxWidth:300}}>
            <span className="search-icon" style={{fontSize:14}}>🔍</span>
            <input className="input search-input" placeholder="Search services…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="tab-bar">
            {['all','manpower','vehicle','rto','financial'].map(t=>(
              <button key={t} className={`tab-item ${typeFilter===t?'active':''}`} onClick={()=>setTypeFilter(t)} style={{textTransform:'capitalize'}}>{t}</button>
            ))}
          </div>
        </div>

        <div className="glass" style={{overflow:'hidden'}}>
          <table className="data-table">
            <thead>
              <tr><th>Icon</th><th>Service Name</th><th>Kannada Name</th><th>Type</th><th>Base Price</th><th>Unit</th><th>Providers</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td style={{fontSize:20}}>{s.icon}</td>
                  <td style={{fontWeight:600}}>{s.name}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{s.nameKn}</td>
                  <td>
                    <span style={{fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:6,
                      background:s.type==='manpower'?'rgba(249,115,22,0.1)':s.type==='vehicle'?'rgba(37,99,235,0.1)':s.type==='rto'?'rgba(22,163,74,0.1)':'rgba(217,119,6,0.1)',
                      color:s.type==='manpower'?'#ea580c':s.type==='vehicle'?'#2563eb':s.type==='rto'?'#16a34a':'#d97706'}}>
                      {s.type}
                    </span>
                  </td>
                  <td style={{fontWeight:700}}>{s.basePrice>0?'₹'+s.basePrice.toLocaleString('en-IN'):'Varies'}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{s.unit}</td>
                  <td style={{fontWeight:600}}>{PROVIDER_COUNTS[s.id]??'—'}</td>
                  <td>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-outline btn-sm" onClick={()=>toast('Edit mode',{icon:'✏️'})}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={()=>toast('Disabled',{icon:'🔴'})}>Off</button>
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
