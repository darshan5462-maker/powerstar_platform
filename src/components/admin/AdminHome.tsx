import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlatformStats, getAllBookingsAdmin, subscribeToBookings } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

const PIE = [
  { name:'Manpower', value:62, color:'#f97316' },
  { name:'Vehicles', value:24, color:'#2563eb' },
  { name:'RTO',      value:9,  color:'#16a34a' },
  { name:'Financial',value:5,  color:'#d97706' },
]
const MONTHLY = [
  { m:'Jan',r:3.2 },{ m:'Feb',r:4.1 },{ m:'Mar',r:3.8 },{ m:'Apr',r:5.2 },
  { m:'May',r:6.4 },{ m:'Jun',r:7.8 },{ m:'Jul',r:8.1 },{ m:'Aug',r:7.2 },
  { m:'Sep',r:8.4 },{ m:'Oct',r:9.2 },
]

export default function AdminHome() {
  const nav = useNavigate()
  const [stats,    setStats]    = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [kyc,      setKyc]      = useState(0)
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    const [s, b, k] = await Promise.all([
      getPlatformStats(),
      getAllBookingsAdmin(),
      supabase.from('providers').select('id', { count:'exact', head:true }).in('kyc_status', ['pending','submitted']),
    ])
    setStats(s)
    setBookings(b.slice(0, 10))
    setKyc(k.count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const ch = subscribeToBookings(() => load())
    return () => { ch.unsubscribe() }
  }, [load])

  const STAT_CARDS = [
    { icon:'📋', bg:'rgba(249,115,22,0.1)', label:'Total Bookings',  val: stats?.totalBookings  ?? 0, sub:`${stats?.activeBookings??0} active now`,   color:'#f97316', path:'/admin/bookings' },
    { icon:'💰', bg:'rgba(22,163,74,0.1)',  label:'Revenue (MTD)',    val: stats?.totalRevenue ? '₹'+Math.round(stats.totalRevenue/1000)+'K' : '₹0', sub:'Completed jobs', color:'#16a34a', path:'/admin/payments' },
    { icon:'👷', bg:'rgba(37,99,235,0.1)',  label:'Total Providers',  val: stats?.totalProviders ?? 0, sub:'Registered',                             color:'#2563eb', path:'/admin/providers' },
    { icon:'👥', bg:'rgba(217,119,6,0.1)',  label:'Total Customers',  val: stats?.totalCustomers ?? 0, sub:'Registered',                             color:'#d97706', path:'' },
  ]

  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Real-time platform overview"
        action={
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text2)' }}>
              <div className="live-dot" style={{ width:6, height:6 }} /> Live
            </div>
            <button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>
          </div>
        }
      />
      <div className="page-content">

        {/* Primary metrics */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
          {STAT_CARDS.map((c, i) => (
            <div key={i} className="glass" style={{ padding:18, cursor:c.path?'pointer':'default', transition:'all 0.18s' }}
              onClick={() => c.path && nav(c.path)}
              onMouseEnter={e => { if(c.path)(e.currentTarget as HTMLElement).style.transform='translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}
            >
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:11, color:'var(--text2)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.3px' }}>{c.label}</p>
                  <p style={{ fontSize:26, fontWeight:800, color:c.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                    {loading ? '...' : typeof c.val === 'number' ? c.val.toLocaleString('en-IN') : c.val}
                  </p>
                  <p style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>{c.sub}</p>
                </div>
                <div style={{ width:40, height:40, borderRadius:10, background:c.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19 }}>{c.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Alert row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
          {[
            { icon:'🔐', label:'KYC Pending',     val: loading?'...':kyc,                            color: kyc>0?'#d97706':'var(--text)',   path:'/admin/kyc',      alert:kyc>0 },
            { icon:'📋', label:'Pending Bookings', val: loading?'...':(stats?.pendingBookings ?? 0),  color:'var(--text)',                    path:'/admin/bookings', alert:false },
            { icon:'⚡', label:'Active Now',       val: loading?'...':(stats?.activeBookings  ?? 0),  color: (stats?.activeBookings??0)>0?'#f97316':'var(--text)', path:'/admin/bookings', alert:false },
          ].map((c, i) => (
            <div key={i} className="glass" style={{ padding:'14px 18px', display:'flex', gap:14, alignItems:'center', cursor:'pointer', borderColor:c.alert?'rgba(217,119,6,0.35)':'var(--border)', transition:'all 0.18s' }}
              onClick={() => c.path && nav(c.path)}>
              <div style={{ fontSize:22, flexShrink:0 }}>{c.icon}</div>
              <div>
                <p style={{ fontSize:12, color:'var(--text2)' }}>{c.label}</p>
                <p style={{ fontSize:22, fontWeight:800, color:c.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{c.val}</p>
              </div>
              {c.alert && <span className="badge badge-yellow" style={{ marginLeft:'auto' }}>Needs action</span>}
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:18, marginBottom:20 }}>
          <div className="glass" style={{ padding:22 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Monthly Revenue (₹L)</h3>
              <span className="badge badge-green">↑ 22% vs last month</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={MONTHLY} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, fontFamily:'Inter,sans-serif', fontSize:12 }} formatter={(v: number) => ['₹'+v+'L', 'Revenue']} />
                <Bar dataKey="r" fill="#f97316" radius={[5,5,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass" style={{ padding:22 }}>
            <h3 style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>Bookings by Type</h3>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={PIE} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" stroke="none">
                  {PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, fontSize:11 }} formatter={(v: number) => [v+'%', '']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
              {PIE.map((d, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:d.color }} />
                    <span style={{ color:'var(--text2)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontWeight:700, color:d.color }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent bookings LIVE */}
        <div className="glass" style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <h3 style={{ fontWeight:700, fontSize:14 }}>Recent Bookings</h3>
              <div className="live-dot" style={{ width:6, height:6 }} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('/admin/bookings')}>View all →</button>
          </div>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--text3)' }}>Loading...</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding:40, textAlign:'center' }}>
              <p style={{ fontSize:32, marginBottom:10 }}>📋</p>
              <p style={{ color:'var(--text2)', marginBottom:6 }}>No bookings yet</p>
              <p style={{ color:'var(--text3)', fontSize:12 }}>Bookings appear here in real-time when customers place orders</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>District</th><th>Amount</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.map((b: any) => (
                  <tr key={b.id}>
                    <td><span style={{ fontFamily:'monospace', fontSize:11, color:'var(--text2)' }}>{b.booking_ref}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Avatar name={b.customer?.full_name ?? 'U'} size={26} />
                        <span style={{ fontWeight:500, fontSize:13 }}>{b.customer?.full_name ?? '—'}</span>
                      </div>
                    </td>
                    <td><span style={{ marginRight:6 }}>{b.category?.icon}</span>{b.category?.name ?? '—'}</td>
                    <td style={{ color:'var(--text2)', fontSize:12 }}>{b.district}</td>
                    <td style={{ fontWeight:700 }}>₹{(b.total_amount||0).toLocaleString('en-IN')}</td>
                    <td style={{ color:'var(--text2)', fontSize:11 }}>
                      {new Date(b.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
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
