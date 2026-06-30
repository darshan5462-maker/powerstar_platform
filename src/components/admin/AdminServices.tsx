import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'

export default function AdminServices() {
  const [services,    setServices]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [typeFilter,  setTypeFilter]  = useState('all')
  const [search,      setSearch]      = useState('')
  const [editId,      setEditId]      = useState<string|null>(null)
  const [editPrice,   setEditPrice]   = useState('')

  useEffect(() => {
    supabase.from('service_categories').select('*').order('sort_order').then(({ data }) => {
      setServices(data ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = services.filter(s =>
    (typeFilter === 'all' || s.type === typeFilter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = services.reduce((acc, s) => { acc[s.type] = (acc[s.type]||0)+1; return acc }, {} as Record<string,number>)

  async function savePrice(id: string) {
    const p = parseFloat(editPrice)
    if (isNaN(p)) { toast.error('Enter a valid price'); return }
    await supabase.from('service_categories').update({ base_price: p }).eq('id', id)
    setServices(prev => prev.map(s => s.id===id ? {...s, base_price:p} : s))
    setEditId(null)
    toast.success('Price updated!')
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('service_categories').update({ is_active: !current }).eq('id', id)
    setServices(prev => prev.map(s => s.id===id ? {...s, is_active:!current} : s))
    toast.success(`Service ${!current ? 'enabled' : 'disabled'}`)
  }

  return (
    <div>
      <PageHeader
        title="Service Categories"
        subtitle={`${services.length} total services across all categories`}
      />
      <div className="page-content">
        {/* Type summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[['manpower','👷','Manpower','#f97316'],['vehicle','🚛','Vehicles','#2563eb'],['rto','📋','RTO','#16a34a'],['financial','💰','Financial','#d97706']].map(([t,icon,label,color])=>(
            <div key={t} className="glass" style={{ padding:'14px 18px', cursor:'pointer', border:`1.5px solid ${typeFilter===t?color:'var(--border)'}`, background:typeFilter===t?`${color}0D`:'var(--card)', transition:'all 0.18s' }}
              onClick={()=>setTypeFilter(typeFilter===t?'all':t as string)}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:20 }}>{icon}</span>
                <div>
                  <p style={{ fontSize:11, color:'var(--text2)' }}>{label}</p>
                  <p style={{ fontSize:20, fontWeight:800, color:color as string, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{counts[t as string]||0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:12, marginBottom:18 }}>
          <div className="search-wrapper" style={{ flex:1, maxWidth:300 }}>
            <span className="search-icon" style={{ fontSize:13 }}>🔍</span>
            <input className="input search-input" placeholder="Search services..." value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="tab-bar">
            {['all','manpower','vehicle','rto','financial'].map(t=>(
              <button key={t} className={`tab-item ${typeFilter===t?'active':''}`} onClick={()=>setTypeFilter(t)} style={{ textTransform:'capitalize' }}>{t}</button>
            ))}
          </div>
        </div>

        <div className="glass" style={{ overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading services...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Icon</th><th>Service Name</th><th>Kannada</th><th>Type</th><th>Base Price</th><th>Unit</th><th>Active</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(s=>(
                  <tr key={s.id} style={{ opacity: s.is_active ? 1 : 0.5 }}>
                    <td style={{ fontSize:20 }}>{s.icon}</td>
                    <td style={{ fontWeight:600 }}>{s.name}</td>
                    <td style={{ color:'var(--text2)', fontSize:12 }}>{s.name_kn ?? '—'}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6,
                        background:s.type==='manpower'?'rgba(249,115,22,0.1)':s.type==='vehicle'?'rgba(37,99,235,0.1)':s.type==='rto'?'rgba(22,163,74,0.1)':'rgba(217,119,6,0.1)',
                        color:s.type==='manpower'?'#ea580c':s.type==='vehicle'?'#2563eb':s.type==='rto'?'#16a34a':'#d97706' }}>
                        {s.type}
                      </span>
                    </td>
                    <td>
                      {editId===s.id ? (
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <input className="input" style={{ width:80, padding:'4px 8px', fontSize:12 }} value={editPrice} onChange={e=>setEditPrice(e.target.value)} autoFocus />
                          <button className="btn btn-success btn-sm" onClick={()=>savePrice(s.id)}>✓</button>
                          <button className="btn btn-ghost btn-sm" onClick={()=>setEditId(null)}>✕</button>
                        </div>
                      ) : (
                        <span style={{ cursor:'pointer', fontWeight:700 }} onDoubleClick={()=>{setEditId(s.id);setEditPrice(String(s.base_price??0))}}>
                          {s.base_price > 0 ? '₹'+Number(s.base_price).toLocaleString('en-IN') : 'Free'}
                        </span>
                      )}
                    </td>
                    <td style={{ color:'var(--text2)', fontSize:12 }}>{s.price_unit}</td>
                    <td>
                      <button className={`toggle ${s.is_active?'on':''}`} onClick={()=>toggleActive(s.id, s.is_active)}>
                        <div className="toggle-knob" />
                      </button>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={()=>{setEditId(s.id);setEditPrice(String(s.base_price??0))}}>Edit Price</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p style={{ fontSize:11, color:'var(--text3)', marginTop:10 }}>💡 Double-click any price to edit it inline.</p>
      </div>
    </div>
  )
}
