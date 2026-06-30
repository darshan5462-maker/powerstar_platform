import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { getProviderBookings } from '@/services/bookingService'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const WEEKLY_DEMO = [
  { day:'Mon', amt:1200 }, { day:'Tue', amt:1650 }, { day:'Wed', amt:980 },
  { day:'Thu', amt:2100 }, { day:'Fri', amt:1400 }, { day:'Sat', amt:2400 }, { day:'Sun', amt:1450 },
]

export default function ProviderEarnings() {
  const { profile }  = useAuthStore()
  const [jobs,    setJobs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    getProviderBookings(profile.id).then(d => { setJobs(d); setLoading(false) })
  }, [profile?.id])

  const completed = jobs.filter(j => j.status === 'completed')
  const totalNet  = completed.reduce((s, j) => s + (j.total_amount || 0) * 0.9, 0)
  const thisMonth = completed.filter(j => new Date(j.created_at).getMonth() === new Date().getMonth())
  const monthNet  = thisMonth.reduce((s, j) => s + (j.total_amount || 0) * 0.9, 0)
  const today     = completed.filter(j => new Date(j.created_at).toDateString() === new Date().toDateString())
  const todayNet  = today.reduce((s, j) => s + (j.total_amount || 0) * 0.9, 0)

  return (
    <div>
      <PageHeader title="Earnings" subtitle="Your income overview and payment history" />
      <div className="page-content">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
          <StatCard icon="💰" iconBg="rgba(249,115,22,0.1)" label="Today"        value={todayNet>0?'₹'+Math.round(todayNet).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="📅" iconBg="rgba(22,163,74,0.1)"  label="This Month"   value={monthNet>0?'₹'+Math.round(monthNet).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="🏆" iconBg="rgba(37,99,235,0.1)"  label="Total Earned" value={totalNet>0?'₹'+Math.round(totalNet).toLocaleString('en-IN'):'₹0'} />
          <StatCard icon="📋" iconBg="rgba(217,119,6,0.1)"  label="Jobs Done"    value={String(completed.length)} />
        </div>

        {/* Chart */}
        <div className="glass" style={{ padding:22, marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:14 }}>Weekly Earnings</h3>
            <span className="badge badge-gray" style={{ fontSize:11 }}>Demo data — live chart coming soon</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={WEEKLY_DEMO} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:'var(--text2)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, fontFamily:'Inter,sans-serif', fontSize:12 }}
                formatter={(v: number) => ['₹'+v.toLocaleString('en-IN'), 'Earned']}
              />
              <Bar dataKey="amt" fill="#f97316" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment history */}
        <div className="glass" style={{ overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontWeight:700, fontSize:14 }}>Payment History</h3>
            <span style={{ fontSize:12, color:'var(--text3)' }}>You receive 90% of booking amount</span>
          </div>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', color:'var(--text3)' }}>Loading...</div>
          ) : completed.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>
              <p style={{ fontSize:32, marginBottom:10 }}>💰</p>
              <p>No completed jobs yet.</p>
              <p style={{ fontSize:12, marginTop:6 }}>Accept job requests to start earning.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Customer</th><th>Service</th><th>Booking Amount</th><th>You Receive (90%)</th><th>Status</th></tr>
              </thead>
              <tbody>
                {completed.map((j: any) => (
                  <tr key={j.id}>
                    <td style={{ color:'var(--text2)', fontSize:12 }}>
                      {new Date(j.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' })}
                    </td>
                    <td style={{ fontWeight:500 }}>{j.customer?.full_name ?? '—'}</td>
                    <td><span style={{ marginRight:5 }}>{j.category?.icon}</span>{j.category?.name}</td>
                    <td style={{ color:'var(--text2)' }}>₹{(j.total_amount||0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight:700, color:'var(--brand)' }}>₹{Math.round((j.total_amount||0)*0.9).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-green">Settled</span></td>
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
