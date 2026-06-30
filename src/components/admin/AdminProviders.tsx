import { useEffect, useState } from 'react'
import { getAllProvidersAdmin, updateKycStatus } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function AdminProviders() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [kycFilter, setKycFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Try providers table first (has KYC data)
    const { data: provs, error: provErr } = await supabase
      .from('providers')
      .select(`
        *,
        profile:profiles!inner(full_name, phone, district, city, created_at, is_active),
        category:service_categories(name, icon)
      `)
      .order('created_at', { ascending: false })

    if (!provErr && provs && provs.length > 0) {
      setProviders(provs)
    } else {
      // Fallback: load all provider-role profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'provider')
        .order('created_at', { ascending: false })
      setProviders((profiles ?? []).map(p => ({ id: p.id, profile: p, kyc_status: 'pending', is_online: false, rating: 0, total_jobs: 0 })))
    }
    setLoading(false)
  }

  const filtered = providers.filter(p => {
    const name = p.profile?.full_name ?? ''
    const dist = p.profile?.district  ?? ''
    const matchS = !search || name.toLowerCase().includes(search.toLowerCase()) || dist.toLowerCase().includes(search.toLowerCase())
    const matchK = kycFilter === 'all' || p.kyc_status === kycFilter
    return matchS && matchK
  })

  async function approve(id: string, name: string) {
    try {
      await updateKycStatus(id, 'verified')
      setProviders(prev => prev.map(p => p.id===id ? {...p, kyc_status:'verified'} : p))
      toast.success(`${name} — KYC Approved ✅`)
    } catch { toast.error('Failed to approve') }
  }

  async function reject(id: string, name: string) {
    try {
      await updateKycStatus(id, 'rejected')
      setProviders(prev => prev.map(p => p.id===id ? {...p, kyc_status:'rejected'} : p))
      toast.error(`${name} — KYC Rejected`)
    } catch { toast.error('Failed to reject') }
  }

  async function toggleSuspend(id: string, currentActive: boolean, name: string) {
    await supabase.from('profiles').update({ is_active: !currentActive }).eq('id', id)
    setProviders(prev => prev.map(p => p.id===id ? {...p, profile:{...p.profile, is_active:!currentActive}} : p))
    toast.success(`${name} ${!currentActive ? 'reactivated' : 'suspended'}`)
  }

  const counts = {
    total:    providers.length,
    verified: providers.filter(p => p.kyc_status === 'verified').length,
    pending:  providers.filter(p => ['pending','submitted'].includes(p.kyc_status)).length,
    online:   providers.filter(p => p.is_online).length,
  }

  return (
    <div>
      <PageHeader
        title="Provider Management"
        subtitle={`${providers.length} total providers`}
        action={<button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>}
      />
      <div className="page-content">

        {/* Summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            ['Total',    counts.total,    'var(--text)'],
            ['Verified', counts.verified, '#16a34a'],
            ['Pending',  counts.pending,  '#d97706'],
            ['Online',   counts.online,   '#f97316'],
          ].map(([l,v,c],i) => (
            <div key={i} className="glass" style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>{l}</span>
              <span style={{ fontSize:22, fontWeight:800, color:c as string, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <div className="search-wrapper" style={{ flex:1, minWidth:200 }}>
            <span className="search-icon" style={{ fontSize:13 }}>🔍</span>
            <input className="input search-input" placeholder="Search by name or district..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tab-bar">
            {[['all','All'],['pending','Pending'],['submitted','Submitted'],['verified','Verified'],['rejected','Rejected']].map(([v,l]) => (
              <button key={v} className={`tab-item ${kycFilter===v?'active':''}`} onClick={() => setKycFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="glass" style={{ overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading providers...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>
              <p style={{ fontSize:36, marginBottom:10 }}>👷</p>
              <p>No providers found. Register provider accounts to see them here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Provider</th><th>Service</th><th>District</th><th>Rating</th><th>Jobs</th><th>KYC</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => {
                  const name = p.profile?.full_name ?? 'Provider'
                  const isActive = p.profile?.is_active !== false
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={name} size={32} />
                          <div>
                            <p style={{ fontWeight:600, fontSize:13 }}>{name}</p>
                            <p style={{ fontSize:10, color:'var(--text3)' }}>{p.profile?.phone ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize:13 }}>
                        {p.category ? <span>{p.category.icon} {p.category.name}</span> : <span style={{ color:'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ color:'var(--text2)', fontSize:12 }}>{p.profile?.district ?? '—'}</td>
                      <td style={{ color:'#d97706', fontWeight:600 }}>
                        {p.rating > 0 ? `★${Number(p.rating).toFixed(1)}` : '—'}
                      </td>
                      <td style={{ fontWeight:600 }}>{p.total_jobs ?? 0}</td>
                      <td><StatusBadge status={p.kyc_status ?? 'pending'} /></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          {p.is_online
                            ? <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#16a34a', fontWeight:600 }}><div className="live-dot" style={{ width:6,height:6 }} />Online</span>
                            : <span style={{ fontSize:11, color:'var(--text3)' }}>Offline</span>}
                          {!isActive && <span className="badge badge-red" style={{ fontSize:9 }}>Suspended</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {(p.kyc_status === 'pending' || p.kyc_status === 'submitted') && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => approve(p.id, name)}>Approve</button>
                              <button className="btn btn-danger btn-sm"  onClick={() => reject(p.id,  name)}>Reject</button>
                            </>
                          )}
                          {p.kyc_status === 'rejected' && (
                            <button className="btn btn-success btn-sm" onClick={() => approve(p.id, name)}>Re-Approve</button>
                          )}
                          <button
                            className={isActive ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm'}
                            onClick={() => toggleSuspend(p.id, isActive, name)}
                          >
                            {isActive ? 'Suspend' : 'Restore'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
