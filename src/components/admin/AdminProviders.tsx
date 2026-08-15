import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function AdminProviders() {
  const navigate = useNavigate()
  const setViewAsRole = useAuthStore(s => s.setViewAsRole)
  const [providers, setProviders] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [kycFilter, setKycFilter] = useState('all')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)

    // Load all provider-role profiles first
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'provider')
      .order('created_at', { ascending: false })

    if (!profiles || profiles.length === 0) {
      setProviders([])
      setLoading(false)
      return
    }

    // Load their providers table rows (has kyc_status, is_online, category)
    const ids = profiles.map(p => p.id)
    const { data: provRows } = await supabase
      .from('providers')
      .select('*, category:service_categories(name, icon)')
      .in('id', ids)

    // Load category names separately for providers that have one
    const provMap: Record<string, any> = {}
    for (const row of provRows ?? []) {
      provMap[row.id] = row
    }

    // Merge: profile data + providers row data
    const merged = profiles.map(p => ({
      ...p,                          // full_name, phone, district, created_at etc
      profile: p,                    // keep nested profile reference too
      kyc_status:  provMap[p.id]?.kyc_status  ?? 'pending',
      is_online:   provMap[p.id]?.is_online   ?? false,
      rating:      provMap[p.id]?.rating      ?? 0,
      total_jobs:  provMap[p.id]?.total_jobs  ?? 0,
      hourly_rate: provMap[p.id]?.hourly_rate ?? 0,
      category:    provMap[p.id]?.category    ?? null,
      hasProviderRow: !!provMap[p.id],
    }))

    setProviders(merged)
    setLoading(false)
  }

  const filtered = providers.filter(p => {
    const matchS = !search ||
      (p.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.district  ?? '').toLowerCase().includes(search.toLowerCase())
    const matchK = kycFilter === 'all' || p.kyc_status === kycFilter
    return matchS && matchK
  })

  // Approve KYC — upsert into providers table, update local state immediately
  async function approve(id: string, name: string) {
    try {
      // Upsert so it works whether providers row exists or not
      const { error } = await supabase
        .from('providers')
        .upsert({ id, kyc_status: 'verified' }, { onConflict: 'id' })
      if (error) throw error

      // Send notification to provider
      await supabase.from('notifications').insert({
        user_id: id,
        title: '✅ KYC Approved!',
        body: 'Your KYC has been approved. Go online from your dashboard to start receiving bookings!',
        type: 'kyc',
      })

      // Update local state immediately — no reload needed
      setProviders(prev => prev.map(p =>
        p.id === id ? { ...p, kyc_status: 'verified', hasProviderRow: true } : p
      ))
      toast.success(`${name} — KYC Approved ✅`)
    } catch (err: any) {
      toast.error('Approve failed: ' + err.message)
    }
  }

  // Reject KYC
  async function reject(id: string, name: string) {
    try {
      const { error } = await supabase
        .from('providers')
        .upsert({ id, kyc_status: 'rejected' }, { onConflict: 'id' })
      if (error) throw error

      await supabase.from('notifications').insert({
        user_id: id,
        title: '❌ KYC Rejected',
        body: 'Your KYC documents were rejected. Please re-upload clear, readable documents.',
        type: 'kyc',
      })

      setProviders(prev => prev.map(p =>
        p.id === id ? { ...p, kyc_status: 'rejected', hasProviderRow: true } : p
      ))
      toast.error(`${name} — KYC Rejected`)
    } catch (err: any) {
      toast.error('Reject failed: ' + err.message)
    }
  }

  // Suspend / restore
  async function toggleSuspend(id: string, currentActive: boolean, name: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !currentActive })
      .eq('id', id)
    if (error) { toast.error('Failed'); return }
    setProviders(prev => prev.map(p =>
      p.id === id ? { ...p, is_active: !currentActive, profile: { ...p.profile, is_active: !currentActive } } : p
    ))
    toast.success(`${name} ${!currentActive ? 'reactivated' : 'suspended'}`)
  }

  function previewAsProvider() {
    setViewAsRole('provider')
    navigate('/provider')
    toast('Previewing Provider dashboard', { icon: '👁️' })
  }

  const counts = {
    total:    providers.length,
    verified: providers.filter(p => p.kyc_status === 'verified').length,
    pending:  providers.filter(p => ['pending', 'submitted'].includes(p.kyc_status)).length,
    online:   providers.filter(p => p.is_online).length,
  }

  return (
    <div>
      <PageHeader
        title="Provider Management"
        subtitle={`${providers.length} total providers`}
        action={
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={previewAsProvider}>👁️ View as Provider</button>
            <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
          </div>
        }
      />
      <div className="page-content">

        {/* Summary cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {[
            ['Total',    counts.total,    'var(--text)'],
            ['Verified', counts.verified, '#16a34a'],
            ['Pending',  counts.pending,  '#d97706'],
            ['Online',   counts.online,   '#f97316'],
          ].map(([l, v, c], i) => (
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
            <input className="input search-input" placeholder="Search by name or district..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="tab-bar">
            {[['all','All'],['pending','Pending'],['submitted','Submitted'],['verified','Verified'],['rejected','Rejected']].map(([v, l]) => (
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
              <p>No providers found.</p>
              <p style={{ fontSize:12, marginTop:6 }}>Register provider accounts to see them here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Service</th>
                  <th>District</th>
                  <th>Rate</th>
                  <th>Jobs</th>
                  <th>KYC</th>
                  <th>Online</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => {
                  const name     = p.full_name ?? 'Provider'
                  const isActive = p.is_active !== false
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={name} size={32} />
                          <div>
                            <p style={{ fontWeight:600, fontSize:13 }}>{name}</p>
                            <p style={{ fontSize:10, color:'var(--text3)' }}>{p.phone ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize:13 }}>
                        {p.category
                          ? <span>{p.category.icon} {p.category.name}</span>
                          : <span style={{ color:'var(--text3)', fontSize:11, fontStyle:'italic' }}>Not set</span>}
                      </td>
                      <td style={{ color:'var(--text2)', fontSize:12 }}>{p.district ?? '—'}</td>
                      <td style={{ fontWeight:600 }}>
                        {p.hourly_rate > 0 ? `₹${p.hourly_rate}/hr` : <span style={{ color:'var(--text3)' }}>—</span>}
                      </td>
                      <td style={{ fontWeight:600 }}>{p.total_jobs ?? 0}</td>
                      <td>
                        {/* KYC badge — reflects live state from our merged data */}
                        <StatusBadge status={p.kyc_status ?? 'pending'} />
                      </td>
                      <td>
                        {p.is_online
                          ? <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <div className="live-dot" style={{ width:6, height:6 }} />
                              <span style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>Online</span>
                            </div>
                          : <span style={{ fontSize:11, color:'var(--text3)' }}>Offline</span>}
                        {!isActive && <span className="badge badge-red" style={{ fontSize:9, display:'block', marginTop:2 }}>Suspended</span>}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                          {/* Show approve/reject based on CURRENT live kyc_status */}
                          {(p.kyc_status === 'pending' || p.kyc_status === 'submitted') && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => approve(p.id, name)}>Approve</button>
                              <button className="btn btn-danger btn-sm"  onClick={() => reject(p.id, name)}>Reject</button>
                            </>
                          )}
                          {p.kyc_status === 'verified' && (
                            <button className="btn btn-danger btn-sm" onClick={() => reject(p.id, name)}>Revoke</button>
                          )}
                          {p.kyc_status === 'rejected' && (
                            <button className="btn btn-success btn-sm" onClick={() => approve(p.id, name)}>Re-Approve</button>
                          )}
                          <button
                            className={isActive ? 'btn btn-outline btn-sm' : 'btn btn-success btn-sm'}
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
