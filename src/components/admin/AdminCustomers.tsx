import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function AdminCustomers() {
  const navigate = useNavigate()
  const setViewAsRole = useAuthStore(s => s.setViewAsRole)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'customer')
      .order('created_at', { ascending: false })
    setCustomers(data ?? [])
    setLoading(false)
  }

  function previewAsCustomer() {
    setViewAsRole('customer')
    navigate('/dashboard')
    toast('Previewing Customer dashboard', { icon: '👁️' })
  }

  const filtered = customers.filter(c => {
    const name = c.full_name ?? ''
    const dist = c.district  ?? ''
    return !search || name.toLowerCase().includes(search.toLowerCase()) || dist.toLowerCase().includes(search.toLowerCase())
  })

  async function toggleSuspend(id: string, currentActive: boolean, name: string) {
    await supabase.from('profiles').update({ is_active: !currentActive }).eq('id', id)
    setCustomers(prev => prev.map(c => c.id===id ? { ...c, is_active: !currentActive } : c))
    toast.success(`${name} ${!currentActive ? 'reactivated' : 'suspended'}`)
  }

  return (
    <div>
      <PageHeader
        title="Customer Management"
        subtitle={`${customers.length} total customers`}
        action={
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-outline btn-sm" onClick={previewAsCustomer}>👁️ View as Customer</button>
            <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
          </div>
        }
      />
      <div className="page-content">

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
          {[
            ['Total',    customers.length, 'var(--text)'],
            ['Active',   customers.filter(c => c.is_active !== false).length, '#16a34a'],
            ['Suspended',customers.filter(c => c.is_active === false).length, '#dc2626'],
          ].map(([l,v,c],i) => (
            <div key={i} className="glass" style={{ padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text2)' }}>{l}</span>
              <span style={{ fontSize:22, fontWeight:800, color:c as string, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{v}</span>
            </div>
          ))}
        </div>

        <div className="search-wrapper" style={{ marginBottom:18, maxWidth:340 }}>
          <span className="search-icon" style={{ fontSize:13 }}>🔍</span>
          <input className="input search-input" placeholder="Search by name or district..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="glass" style={{ overflow:'hidden' }}>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading customers...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>
              <p style={{ fontSize:36, marginBottom:10 }}>👥</p>
              <p>No customers found.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Customer</th><th>Phone</th><th>District</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => {
                  const isActive = c.is_active !== false
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={c.full_name} size={32} />
                          <div>
                            <p style={{ fontWeight:600, fontSize:13 }}>{c.full_name}</p>
                            <p style={{ fontSize:10, color:'var(--text3)' }}>{c.id.slice(0,8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ color:'var(--text2)', fontSize:12 }}>{c.phone ?? '—'}</td>
                      <td style={{ color:'var(--text2)', fontSize:12 }}>{c.district ?? '—'}</td>
                      <td style={{ color:'var(--text2)', fontSize:11 }}>
                        {new Date(c.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}
                      </td>
                      <td>
                        {isActive
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-red">Suspended</span>}
                      </td>
                      <td>
                        <button
                          className={isActive ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm'}
                          onClick={() => toggleSuspend(c.id, isActive, c.full_name)}
                        >
                          {isActive ? 'Suspend' : 'Restore'}
                        </button>
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
