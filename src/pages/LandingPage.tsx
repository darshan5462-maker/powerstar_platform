import { useNavigate } from 'react-router-dom'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { MANPOWER, VEHICLES } from '@/data/services'
import { DISTRICTS, getCities } from '@/data/karnataka'
import { useState } from 'react'

const STATS  = [['4,200+','Verified Providers'],['850+','Vehicles Available'],['31','Karnataka Districts'],['4.8★','Avg. Rating']]
const TRUST  = [['✅','KYC Verified','Every provider passes Aadhaar + background check'],['💰','Transparent Pricing','Exact cost before confirmation. No hidden fees.'],['🛡️','Work Guarantee','Not happy? Free rework within 24 hours.'],['📍','Live GPS','Track provider from acceptance to completion.'],['💬','Kannada Support','Available in Kannada, Hindi, English & more.'],['⚡','3-min Response','Average acceptance time across all 31 districts.']]
const HOW    = [['🔍','Search','Choose service, district & city. See online providers instantly.'],['👤','Compare','View profiles, ratings & upfront price estimates.'],['💳','Book & Pay','Confirm via UPI/card. Pay only after job completion.'],['📍','Track','Real-time GPS tracking until the job is done.']]

export default function LandingPage() {
  const navigate = useNavigate()
  const [tab, setTab]         = useState<'workers'|'vehicles'|'rto'>('workers')
  const [district, setDistrict] = useState(DISTRICTS[0].id)
  const [hoveredSvc, setHoveredSvc] = useState<string|null>(null)

  return (
    <div style={{background:'var(--bg)',minHeight:'100vh'}}>

      {/* NAV */}
      <nav style={{position:'sticky',top:0,zIndex:50,background:'var(--card)',borderBottom:'1px solid var(--border)',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64,backdropFilter:'blur(12px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:38,height:38,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>⚡</div>
          <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:18}}>POWER<span style={{color:'#f97316'}}>STAR</span></span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <ThemeToggle />
          <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/auth')}>Login</button>
          <button className="btn btn-outline btn-sm" onClick={()=>navigate('/auth')}>Join as Provider</button>
          <button className="btn btn-brand btn-sm" onClick={()=>navigate('/auth')}>Book a Service</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{padding:'80px 32px 60px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-120,left:'50%',transform:'translateX(-50%)',width:600,height:400,background:'radial-gradient(ellipse,rgba(249,115,22,0.08) 0%,transparent 70%)',pointerEvents:'none'}} />
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--brand-light)',border:'1px solid rgba(249,115,22,0.25)',color:'var(--brand)',padding:'6px 16px',borderRadius:99,fontSize:12,fontWeight:600,marginBottom:28}}>
          <div className="live-dot" style={{width:6,height:6}} />
          4,200+ workers live across Karnataka
        </div>
        <h1 style={{fontSize:'clamp(36px,6vw,72px)',fontWeight:900,lineHeight:1.06,letterSpacing:'-1.5px',marginBottom:20,fontFamily:'Plus Jakarta Sans,sans-serif'}}>
          City workers,<br/><span style={{background:'linear-gradient(135deg,#f97316,#ea580c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>on demand.</span><br/>
          <span style={{color:'var(--text2)'}}>Across Karnataka.</span>
        </h1>
        <p style={{fontSize:18,color:'var(--text2)',maxWidth:540,margin:'0 auto 36px',lineHeight:1.65}}>
          Book verified electricians, plumbers, drivers & transport vehicles. Transparent pricing, live GPS, KYC-verified providers.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button className="btn btn-brand btn-lg" onClick={()=>navigate('/auth')}>Get Started Free →</button>
          <button className="btn btn-outline btn-lg" onClick={()=>document.getElementById('vehicles')?.scrollIntoView({behavior:'smooth'})}>View Vehicles</button>
        </div>
      </section>

      {/* STATS */}
      <div style={{background:'var(--card)',borderTop:'1px solid var(--border)',borderBottom:'1px solid var(--border)',margin:'0 32px',borderRadius:16}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)'}}>
          {STATS.map(([v,l],i)=>(
            <div key={i} style={{padding:'24px 16px',textAlign:'center',borderRight:i<3?'1px solid var(--border)':'none'}}>
              <div style={{fontSize:28,fontWeight:900,color:'var(--brand)',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{v}</div>
              <div style={{fontSize:13,color:'var(--text2)',marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SEARCH */}
      <section style={{padding:'60px 32px',background:'var(--bg2)'}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <p style={{fontSize:11,fontWeight:700,color:'var(--brand)',textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:8}}>Quick Find</p>
          <h2 style={{fontSize:34,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:8}}>Find what you need, right now</h2>
          <p style={{color:'var(--text2)',fontSize:15}}>Search 4,200+ providers across all Karnataka districts</p>
        </div>
        <div className="glass" style={{maxWidth:780,margin:'0 auto',padding:28}}>
          <div className="tab-bar" style={{marginBottom:24}}>
            {([['workers','👷 Workers'],['vehicles','🚛 Vehicles'],['rto','📋 RTO / Finance']] as const).map(([t,l])=>(
              <button key={t} className={`tab-item ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{l}</button>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
            <div>
              <label className="input-label">{tab==='workers'?'Service Type':tab==='vehicles'?'Vehicle Type':'Service'}</label>
              <select className="input">
                {tab==='workers'  && MANPOWER.map(s=><option key={s.id}>{s.name}</option>)}
                {tab==='vehicles' && VEHICLES.map(s=><option key={s.id}>{s.name}</option>)}
                {tab==='rto'      && ['Vehicle Insurance','PUC Certificate','Driving License','Vehicle Passing','GPS Install','Vehicle Loan','Personal Loan'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">District</label>
              <select className="input" value={district} onChange={e=>setDistrict(e.target.value)}>
                {DISTRICTS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">City / Area</label>
              <select className="input">
                {getCities(district).map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-brand" style={{width:'100%',padding:'12px',fontSize:15}} onClick={()=>navigate('/auth')}>
            🔍 Find Available Providers Now
          </button>
        </div>
      </section>

      {/* MANPOWER GRID */}
      <section style={{padding:'60px 32px'}}>
        <p style={{fontSize:11,fontWeight:700,color:'var(--brand)',textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:8}}>Manpower Services</p>
        <h2 style={{fontSize:34,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:6}}>Every skilled worker, one platform</h2>
        <p style={{color:'var(--text2)',fontSize:15,marginBottom:36}}>KYC verified professionals, background checked &amp; rated by thousands of customers</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:12}}>
          {MANPOWER.map(s=>(
            <div key={s.id}
              className={`glass ${hoveredSvc===s.id?'glass-hover':''}`}
              style={{padding:'18px 12px',textAlign:'center',cursor:'pointer',transition:'all 0.2s'}}
              onClick={()=>navigate('/auth')}
              onMouseEnter={()=>setHoveredSvc(s.id)}
              onMouseLeave={()=>setHoveredSvc(null)}
            >
              <div style={{fontSize:28,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:12,fontWeight:600,marginBottom:3}}>{s.name}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>from ₹{s.basePrice}{s.unit}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VEHICLES */}
      <section id="vehicles" style={{padding:'60px 32px',background:'var(--bg2)'}}>
        <p style={{fontSize:11,fontWeight:700,color:'var(--brand)',textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:8}}>Goods Transport</p>
        <h2 style={{fontSize:34,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:6}}>Right vehicle for every load</h2>
        <p style={{color:'var(--text2)',fontSize:15,marginBottom:36}}>GPS tracked, insured, fixed pricing. Book with or without workers.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:14}}>
          {VEHICLES.map(v=>(
            <div key={v.id} className="glass glass-hover" style={{padding:20,cursor:'pointer'}} onClick={()=>navigate('/auth')}>
              <div style={{fontSize:36,marginBottom:10}}>{v.icon}</div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{v.name}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginBottom:10}}>{v.capacity}</div>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <span style={{fontWeight:800,fontSize:16,color:'var(--brand)'}}>₹{v.basePrice.toLocaleString('en-IN')}</span>
                <span style={{fontSize:11,color:'var(--text3)'}}>{v.unit}</span>
                {v.withWorker && <span className="badge badge-green" style={{fontSize:10}}>+worker</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:'60px 32px'}}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <p style={{fontSize:11,fontWeight:700,color:'var(--brand)',textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:8}}>How It Works</p>
          <h2 style={{fontSize:34,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif'}}>Booked in under 3 minutes</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20,maxWidth:900,margin:'0 auto'}}>
          {HOW.map(([icon,title,desc],i)=>(
            <div key={i} className="glass" style={{padding:24,textAlign:'center'}}>
              <div style={{width:52,height:52,background:'linear-gradient(135deg,rgba(249,115,22,0.15),rgba(234,88,12,0.08))',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,margin:'0 auto 14px'}}>
                {icon}
              </div>
              <div style={{fontWeight:700,fontSize:15,marginBottom:8,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{title}</div>
              <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.55}}>{desc}</div>
              <div style={{marginTop:12,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:28,fontWeight:900,color:'var(--border)'}}>0{i+1}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST */}
      <section style={{padding:'60px 32px',background:'var(--bg2)'}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <p style={{fontSize:11,fontWeight:700,color:'var(--brand)',textTransform:'uppercase',letterSpacing:'1.5px',marginBottom:8}}>Why POWERSTAR</p>
          <h2 style={{fontSize:34,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif'}}>Built for Karnataka, built to last</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,maxWidth:900,margin:'0 auto'}}>
          {TRUST.map(([icon,title,desc],i)=>(
            <div key={i} className="glass" style={{padding:22}}>
              <div style={{width:42,height:42,background:'linear-gradient(135deg,rgba(249,115,22,0.12),rgba(234,88,12,0.06))',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:12}}>{icon}</div>
              <div style={{fontWeight:700,fontSize:14,marginBottom:6,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{title}</div>
              <div style={{fontSize:13,color:'var(--text2)',lineHeight:1.55}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PROVIDER CTA */}
      <section style={{padding:'80px 32px',textAlign:'center',background:'linear-gradient(135deg,rgba(249,115,22,0.04),var(--bg))'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--brand-light)',border:'1px solid rgba(249,115,22,0.25)',color:'var(--brand)',padding:'6px 16px',borderRadius:99,fontSize:12,fontWeight:600,marginBottom:24}}>
          👷 For Providers
        </div>
        <h2 style={{fontSize:40,fontWeight:900,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:14,lineHeight:1.1}}>
          Earn more.<br/><span style={{background:'linear-gradient(135deg,#f97316,#ea580c)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>Work on your terms.</span>
        </h2>
        <p style={{color:'var(--text2)',fontSize:16,maxWidth:440,margin:'0 auto 36px',lineHeight:1.6}}>
          Join 4,200+ workers earning steady income. Set your schedule, choose your jobs, get paid within 24 hours.
        </p>
        <div style={{display:'flex',gap:16,justifyContent:'center',flexWrap:'wrap',marginBottom:40}}>
          {[['₹800–2,400','Daily earnings'],['24 hrs','Settlement'],['0%','Subscription fee'],['4.8★','Platform rating']].map(([v,l],i)=>(
            <div key={i} className="glass" style={{padding:'16px 24px',minWidth:120,textAlign:'center'}}>
              <div style={{fontSize:20,fontWeight:800,color:'var(--brand)',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{v}</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
        <button className="btn btn-brand btn-lg" onClick={()=>navigate('/auth')}>Register as Provider →</button>
      </section>

      {/* FOOTER */}
      <footer style={{borderTop:'1px solid var(--border)',background:'var(--card)',padding:'48px 32px 32px'}}>
        <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:40,marginBottom:32}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
              <div style={{width:32,height:32,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⚡</div>
              <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:16}}>POWER<span style={{color:'#f97316'}}>STAR</span></span>
            </div>
            <p style={{color:'var(--text2)',fontSize:13,lineHeight:1.65,maxWidth:240}}>Karnataka's most trusted platform for verified manpower, goods transport and city services across all 31 districts.</p>
          </div>
          {[{h:'Services',links:['Manpower','Vehicles','RTO Services','Financial']},{h:'Providers',links:['Register','Provider Login','KYC Guide','Earnings']},{h:'Company',links:['About','Careers','Privacy','Terms']}].map((col,i)=>(
            <div key={i}>
              <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:14}}>{col.h}</p>
              {col.links.map((l,j)=><p key={j} style={{fontSize:13,color:'var(--text2)',marginBottom:10,cursor:'pointer',transition:'color 0.15s'}} onMouseEnter={e=>(e.target as HTMLElement).style.color='var(--brand)'} onMouseLeave={e=>(e.target as HTMLElement).style.color='var(--text2)'}>{l}</p>)}
            </div>
          ))}
        </div>
        <div style={{borderTop:'1px solid var(--border)',paddingTop:20,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p style={{fontSize:12,color:'var(--text3)'}}>© 2025 POWERSTAR Platform. All 31 Karnataka Districts.</p>
          <p style={{fontSize:12,color:'var(--text3)'}}>Built with ❤️ in Karnataka</p>
        </div>
      </footer>
    </div>
  )
}
