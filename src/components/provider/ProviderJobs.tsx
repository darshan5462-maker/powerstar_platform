import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

const REQUESTS = [
  {id:'PS-28401',svc:'Plumbing — Pipe Leakage',icon:'🔧',customer:'Ramesh Kumar',addr:'Koramangala, Bengaluru',amount:580,time:'Right now',dist:'1.2 km',note:'Kitchen pipe leaking badly, urgent!'},
  {id:'PS-28398',svc:'Plumbing — Bathroom Fitting',icon:'🔧',customer:'Anitha Rao',addr:'Indiranagar, Bengaluru',amount:960,time:'Today 5 PM',dist:'4.5 km',note:'New bathroom fitting needed'},
]
const MY_JOBS = [
  {id:'PS-2847',customer:'Ramesh Kumar',svc:'Pipe Leakage',  date:'Today 2:30 PM',earned:'₹522',status:'active'},
  {id:'PS-2839',customer:'Priya Sharma', svc:'Tap Repair',   date:'Today 9:00 AM',earned:'₹405',status:'completed'},
  {id:'PS-2831',customer:'Ahmed Khan',   svc:'Tank Cleaning', date:'Today 11:30 AM',earned:'₹315',status:'completed'},
  {id:'PS-2820',customer:'Kavitha M.',   svc:'Bathroom Fitting',date:'Jun 14',      earned:'₹864',status:'completed'},
  {id:'PS-2810',customer:'Sunil Gowda',  svc:'Pipeline Work', date:'Jun 12',        earned:'₹1,080',status:'completed'},
]

export default function ProviderJobs({ myJobs=false }: { myJobs?: boolean }) {
  if (myJobs) return (
    <div>
      <PageHeader title="My Jobs" subtitle="All accepted and completed jobs" />
      <div className="page-content">
        <div className="glass" style={{overflow:'hidden'}}>
          <table className="data-table">
            <thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Date</th><th>Earned</th><th>Status</th></tr></thead>
            <tbody>
              {MY_JOBS.map(j=>(
                <tr key={j.id}>
                  <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)'}}>{j.id}</span></td>
                  <td style={{fontWeight:500}}>{j.customer}</td>
                  <td>🔧 {j.svc}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{j.date}</td>
                  <td style={{fontWeight:700,color:'var(--brand)'}}>{j.earned}</td>
                  <td><StatusBadge status={j.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Job Requests" subtitle="New booking requests near you · auto-refreshes every 15s" />
      <div className="page-content" style={{maxWidth:640}}>
        {REQUESTS.length===0 ? (
          <div className="glass" style={{padding:48,textAlign:'center'}}>
            <p style={{fontSize:40,marginBottom:12}}>📭</p>
            <p style={{color:'var(--text2)'}}>No requests right now. Stay online to receive jobs!</p>
          </div>
        ) : REQUESTS.map(r=>(
          <div key={r.id} className="glass" style={{padding:20,marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div style={{display:'flex',gap:12,alignItems:'center'}}>
                <span style={{fontSize:28}}>{r.icon}</span>
                <div>
                  <p style={{fontWeight:700,fontSize:15}}>{r.svc}</p>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
                    <Avatar name={r.customer} size={18} />
                    <p style={{fontSize:12,color:'var(--text2)'}}>{r.customer}</p>
                  </div>
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <p style={{fontWeight:800,fontSize:22,color:'var(--brand)'}}>₹{r.amount}</p>
                <p style={{fontSize:11,color:'var(--text3)'}}>Est. 2 hrs</p>
              </div>
            </div>
            <div style={{display:'flex',gap:16,fontSize:12,color:'var(--text2)',marginBottom:10,flexWrap:'wrap'}}>
              <span>📍 {r.addr}</span><span>🕒 {r.time}</span><span>📏 {r.dist}</span>
            </div>
            {r.note && (
              <div style={{background:'var(--bg2)',borderRadius:8,padding:'8px 12px',fontSize:12,color:'var(--text2)',marginBottom:12}}>
                💬 "{r.note}"
              </div>
            )}
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-success" style={{flex:1}} onClick={()=>toast.success(`Job accepted! Navigate to ${r.customer}.`)}>✓ Accept Job</button>
              <button className="btn btn-outline" style={{flex:1}} onClick={()=>toast('Job declined',{icon:'❌'})}>Decline</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
