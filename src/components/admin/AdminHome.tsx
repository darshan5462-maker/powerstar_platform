import { useNavigate } from 'react-router-dom'
import StatCard from '@/components/ui/StatCard'
import PageHeader from '@/components/layout/PageHeader'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'

const MONTHLY = [
  {m:'Jan',r:3.2},{m:'Feb',r:4.1},{m:'Mar',r:3.8},{m:'Apr',r:5.2},
  {m:'May',r:6.4},{m:'Jun',r:7.8},{m:'Jul',r:8.1},{m:'Aug',r:7.2},
  {m:'Sep',r:8.4},{m:'Oct',r:9.2},
]
const PIE_DATA = [
  {name:'Manpower',value:62,color:'#f97316'},
  {name:'Vehicles', value:24,color:'#2563eb'},
  {name:'RTO',      value:9, color:'#16a34a'},
  {name:'Financial',value:5, color:'#d97706'},
]
const LIVE_FEED = [
  'Ramesh K. booked Electrician · Koramangala',
  'Tata Ace confirmed for shifting · Mysuru',
  'Suresh P. completed Plumbing ★★★★★',
  'JCB booked · Mangaluru construction site',
  'New provider KYC submitted · Mahesh R.',
  '₹2,100 settled to Mason · Davangere',
  'Dispute #3 resolved — refund issued',
]

export default function AdminHome() {
  const nav = useNavigate()
  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Platform overview — All 31 Karnataka Districts"
        action={<div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text2)'}}><div className="live-dot" style={{width:6,height:6}} /> Live · updates every 30s</div>}
      />
      <div className="page-content">

        {/* Primary stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
          <StatCard icon="📋" iconBg="rgba(249,115,22,0.1)" label="Total Bookings"    value="1,284"  change="127 today" up onClick={()=>nav('/admin/bookings')} />
          <StatCard icon="💰" iconBg="rgba(22,163,74,0.1)"  label="Revenue (MTD)"     value="₹9.2L"  change="22% vs last month" up onClick={()=>nav('/admin/payments')} />
          <StatCard icon="👷" iconBg="rgba(37,99,235,0.1)"  label="Active Providers"  value="4,218"  change="847 online now" up onClick={()=>nav('/admin/providers')} />
          <StatCard icon="👥" iconBg="rgba(217,119,6,0.1)"  label="Customers"         value="28,400" change="1,200 this week" up />
        </div>

        {/* Charts row */}
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:20}}>
          <div className="glass" style={{padding:22}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{fontWeight:700,fontSize:15}}>Monthly Revenue</h3>
              <span className="badge badge-green">↑ 22% vs last month</span>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={MONTHLY} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{fill:'var(--text2)',fontSize:11}} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,fontFamily:'Inter,sans-serif',fontSize:12}} formatter={(v:number)=>['₹'+v+'L','Revenue']} />
                <Bar dataKey="r" fill="#f97316" radius={[5,5,0,0]} opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass" style={{padding:22}}>
            <h3 style={{fontWeight:700,fontSize:15,marginBottom:16}}>Bookings by Category</h3>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" stroke="none">
                  {PIE_DATA.map((e,i)=><Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,fontSize:12}} formatter={(v:number)=>[v+'%','']} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
              {PIE_DATA.map((d,i)=>(
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:d.color,flexShrink:0}} />
                    <span style={{color:'var(--text2)'}}>{d.name}</span>
                  </div>
                  <span style={{fontWeight:700,color:d.color}}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:20}}>
          <div className="glass" style={{padding:16,cursor:'pointer'}} onClick={()=>nav('/admin/disputes')}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{fontSize:24}}>⚠️</div>
              <div>
                <p style={{fontSize:12,color:'var(--text2)'}}>Open Disputes</p>
                <p style={{fontSize:22,fontWeight:800,color:'#dc2626',fontFamily:'Plus Jakarta Sans,sans-serif'}}>3</p>
                <p style={{fontSize:11,color:'#dc2626',fontWeight:600}}>Needs action</p>
              </div>
            </div>
          </div>
          <div className="glass" style={{padding:16,cursor:'pointer'}} onClick={()=>nav('/admin/kyc')}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{fontSize:24}}>🔐</div>
              <div>
                <p style={{fontSize:12,color:'var(--text2)'}}>KYC Pending</p>
                <p style={{fontSize:22,fontWeight:800,color:'#d97706',fontFamily:'Plus Jakarta Sans,sans-serif'}}>12</p>
                <p style={{fontSize:11,color:'#d97706',fontWeight:600}}>Awaiting review</p>
              </div>
            </div>
          </div>
          <div className="glass" style={{padding:16}}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{fontSize:24}}>⭐</div>
              <div>
                <p style={{fontSize:12,color:'var(--text2)'}}>Platform Rating</p>
                <p style={{fontSize:22,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif'}}>4.8</p>
                <p style={{fontSize:11,color:'#16a34a',fontWeight:600}}>↑ vs 4.6 last month</p>
              </div>
            </div>
          </div>
          <div className="glass" style={{padding:16}}>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              <div style={{fontSize:24}}>⚡</div>
              <div>
                <p style={{fontSize:12,color:'var(--text2)'}}>Avg. Response</p>
                <p style={{fontSize:22,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif'}}>2.8m</p>
                <p style={{fontSize:11,color:'var(--text2)'}}>Provider acceptance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live feed */}
        <div className="glass" style={{padding:20}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
            <h3 style={{fontWeight:700,fontSize:15}}>Live Platform Activity</h3>
            <div className="live-dot" style={{width:6,height:6}} />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {LIVE_FEED.map((item,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,background:'var(--bg2)',borderRadius:8,padding:'9px 14px',fontSize:13}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#16a34a',flexShrink:0}} />
                <span style={{flex:1,color:'var(--text2)'}}>{item}</span>
                <span style={{fontSize:11,color:'var(--text3)',flexShrink:0}}>{(i+1)*2}m ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
