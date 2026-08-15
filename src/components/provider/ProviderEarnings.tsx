import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const WEEKLY = [
  {day:'Mon',amt:1200},{day:'Tue',amt:1650},{day:'Wed',amt:980},
  {day:'Thu',amt:2100},{day:'Fri',amt:1400},{day:'Sat',amt:2400},{day:'Sun',amt:1450},
]
const HISTORY = [
  {date:'Jun 16',customer:'Ramesh K.',svc:'Pipe Leakage',gross:'₹580',net:'₹522',status:'pending'},
  {date:'Jun 16',customer:'Priya S.', svc:'Tap Repair',  gross:'₹450',net:'₹405',status:'settled'},
  {date:'Jun 15',customer:'Kavitha M.',svc:'Fitting',    gross:'₹960',net:'₹864',status:'settled'},
  {date:'Jun 14',customer:'Sunil G.', svc:'Pipeline',    gross:'₹1,200',net:'₹1,080',status:'settled'},
]

export default function ProviderEarnings() {
  return (
    <div>
      <PageHeader title="Earnings" subtitle="Your income overview and payment history" />
      <div className="page-content">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          <StatCard icon="💰" iconBg="rgba(249,115,22,0.1)" label="Today"       value="₹1,450" change="₹280 vs yesterday" up />
          <StatCard icon="📅" iconBg="rgba(22,163,74,0.1)"  label="This Week"   value="₹8,200" change="12% vs last week" up />
          <StatCard icon="🗓️" iconBg="rgba(37,99,235,0.1)"  label="This Month"  value="₹28,400" change="8% vs last month" up />
          <StatCard icon="📋" iconBg="rgba(217,119,6,0.1)"  label="Total Jobs"  value="142" />
        </div>

        <div className="glass" style={{padding:24,marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <h3 style={{fontWeight:700,fontSize:15}}>Weekly Earnings</h3>
            <span className="badge badge-green">↑ 12% vs last week</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={WEEKLY} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{fill:'var(--text2)',fontSize:12}} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:12}} formatter={(v:number)=>['₹'+v,'Earned']} />
              <Bar dataKey="amt" fill="#f97316" radius={[6,6,0,0]} opacity={0.9} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{overflow:'hidden'}}>
          <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:14}}>Payment History</div>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Customer</th><th>Service</th><th>Gross</th><th>Net (90%)</th><th>Status</th></tr></thead>
            <tbody>
              {HISTORY.map((h,i)=>(
                <tr key={i}>
                  <td style={{color:'var(--text2)',fontSize:12}}>{h.date}</td>
                  <td style={{fontWeight:500}}>{h.customer}</td>
                  <td style={{color:'var(--text2)'}}>🔧 {h.svc}</td>
                  <td>{h.gross}</td>
                  <td style={{fontWeight:700,color:'var(--brand)'}}>{h.net}</td>
                  <td><span className={h.status==='settled'?'badge badge-green':'badge badge-yellow'}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
