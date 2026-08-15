import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type Role } from '@/store/authStore'
import { signIn, signUp } from '@/services/authService'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { DISTRICTS } from '@/data/karnataka'
import toast from 'react-hot-toast'

const DEMO = [
  { role:'customer' as Role, email:'customer@demo.com', pwd:'demo1234', label:'Customer Demo',  icon:'👤', color:'#2563eb' },
  { role:'provider' as Role, email:'provider@demo.com', pwd:'demo1234', label:'Provider Demo',  icon:'👷', color:'#16a34a' },
  { role:'admin'    as Role, email:'admin@powerstar.in', pwd:'Admin@2025!', label:'Admin Demo', icon:'⚙️', color:'#7c3aed' },
]

const FEATURES = [
  '4,200+ KYC-verified providers',
  'Live GPS tracking on every booking',
  'Transparent pricing, zero surprises',
  'All 31 Karnataka districts covered',
  'Work guarantee on every service',
  '3-minute average response time',
]

export default function AuthPage() {
  const { profile } = useAuthStore()
  const navigate = useNavigate()
  const [mode, setMode]     = useState<'login'|'register'>('login')
  const [role, setRole]     = useState<Role>('customer')
  const [loading, setLoading] = useState(false)
  const [form, setForm]     = useState({ email:'customer@demo.com', password:'demo1234', full_name:'', phone:'', district:'Bengaluru Urban' })

  useEffect(() => {
    if (profile) navigate(profile.role==='admin'?'/admin':profile.role==='provider'?'/provider':'/dashboard', { replace:true })
  }, [profile])

  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f=>({...f,[k]:e.target.value}))

  function fillDemo(d: typeof DEMO[0]) {
    setRole(d.role)
    setMode('login')
    setForm(f=>({...f, email:d.email, password:d.pwd}))
    toast(`Filled ${d.label} credentials`, { icon: d.icon })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
      } else {
        if (!form.full_name.trim() || !form.phone.trim()) { toast.error('Please fill all required fields'); return }
        await signUp({ email:form.email, password:form.password, full_name:form.full_name, phone:form.phone, role, district:form.district })
        toast.success('Account created! Welcome to POWERSTAR 🎉')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',background:'var(--bg)'}}>
      {/* Left panel */}
      <div style={{display:'none',flex:1,background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',padding:'40px 48px',flexDirection:'column',justifyContent:'space-between',position:'relative',overflow:'hidden'}} className="auth-left">
        <style>{`.auth-left{display:flex!important}`}{`@media(max-width:900px){.auth-left{display:none!important}}`}</style>

        {/* Decorative blobs */}
        <div style={{position:'absolute',top:-100,right:-100,width:400,height:400,background:'rgba(249,115,22,0.08)',borderRadius:'50%',filter:'blur(80px)'}} />
        <div style={{position:'absolute',bottom:-80,left:-80,width:300,height:300,background:'rgba(37,99,235,0.08)',borderRadius:'50%',filter:'blur(60px)'}} />

        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:60}}>
            <div style={{width:44,height:44,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>⚡</div>
            <div>
              <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:20,color:'#f8fafc'}}>POWER<span style={{color:'#f97316'}}>STAR</span></div>
              <div style={{fontSize:11,color:'#64748b',marginTop:1}}>Karnataka City Services</div>
            </div>
          </div>

          <h2 style={{fontSize:36,fontWeight:800,color:'#f8fafc',lineHeight:1.15,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:16}}>
            Karnataka's most<br/>trusted <span style={{color:'#f97316'}}>city services</span><br/>platform.
          </h2>
          <p style={{color:'#94a3b8',fontSize:15,lineHeight:1.6,marginBottom:40}}>
            Book verified workers & vehicles instantly. Transparent pricing, live GPS tracking, KYC-verified providers.
          </p>

          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {FEATURES.map((f,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,color:'#94a3b8',fontSize:14}}>
                <div style={{width:20,height:20,background:'rgba(249,115,22,0.15)',borderRadius:50,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:11}}>✓</div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',gap:16'}}>
            {[['4,200+','Providers'],['31','Districts'],['4.8★','Rating']].map(([v,l],i)=>(
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:800,color:'#f97316',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{v}</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 24px',overflowY:'auto'}}>
        <div style={{width:'100%',maxWidth:440}}>

          {/* Header */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>navigate('/')}>
              <div style={{width:36,height:36,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>⚡</div>
              <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:16}}>POWER<span style={{color:'#f97316'}}>STAR</span></span>
            </div>
            <ThemeToggle />
          </div>

          <h1 style={{fontSize:26,fontWeight:800,marginBottom:4,fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            {mode==='login' ? 'Welcome back 👋' : 'Create account'}
          </h1>
          <p style={{color:'var(--text2)',fontSize:14,marginBottom:24}}>
            {mode==='login' ? 'Sign in to continue to POWERSTAR' : 'Join thousands of users across Karnataka'}
          </p>

          {/* Demo quick-fill */}
          {mode==='login' && (
            <div style={{marginBottom:20}}>
              <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>Quick demo access</p>
              <div style={{display:'flex',gap:8'}}>
                {DEMO.map(d => (
                  <button key={d.role} onClick={()=>fillDemo(d)}
                    style={{flex:1,padding:'8px 6px',borderRadius:10,border:'1.5px solid var(--border)',background:'var(--bg2)',cursor:'pointer',transition:'all 0.15s',fontFamily:'Inter,sans-serif'}}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=d.color;(e.currentTarget as HTMLElement).style.background='var(--card)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--border)';(e.currentTarget as HTMLElement).style.background='var(--bg2)'}}>
                    <div style={{fontSize:18,marginBottom:3}}>{d.icon}</div>
                    <div style={{fontSize:11,fontWeight:600,color:'var(--text)'}}>{d.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Role tabs (register) */}
          {mode==='register' && (
            <div style={{marginBottom:20}}>
              <p style={{fontSize:11,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:8}}>I want to</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {([['customer','Book Services','👤'],['provider','Offer Services','👷']] as const).map(([r,l,icon])=>(
                  <button key={r} onClick={()=>setRole(r as Role)}
                    style={{padding:'12px',borderRadius:12,border:`2px solid ${role===r?'var(--brand)':'var(--border)'}`,background:role===r?'var(--brand-light)':'var(--bg2)',cursor:'pointer',transition:'all 0.2s',fontFamily:'Inter,sans-serif'}}>
                    <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                    <div style={{fontSize:13,fontWeight:600,color:role===r?'var(--brand)':'var(--text)'}}>{l}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
            {mode==='register' && <>
              <div>
                <label className="input-label">Full Name *</label>
                <input className="input" placeholder="Ramesh Kumar" value={form.full_name} onChange={set('full_name')} required />
              </div>
              <div>
                <label className="input-label">Phone *</label>
                <input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required />
              </div>
            </>}
            <div>
              <label className="input-label">Email address *</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="input-label">Password *</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            {mode==='register' && (
              <div>
                <label className="input-label">District *</label>
                <select className="input" value={form.district} onChange={set('district')}>
                  {DISTRICTS.map(d=><option key={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn btn-brand btn-lg" style={{marginTop:4,width:'100%'}}>
              {loading ? 'Please wait…' : mode==='login' ? 'Sign in →' : 'Create account →'}
            </button>
          </form>

          <p style={{textAlign:'center',marginTop:20,fontSize:13,color:'var(--text2)'}}>
            {mode==='login' ? "Don't have an account? " : 'Already have an account? '}
            <span style={{color:'var(--brand)',cursor:'pointer',fontWeight:600}} onClick={()=>setMode(m=>m==='login'?'register':'login')}>
              {mode==='login' ? 'Register free' : 'Sign in'}
            </span>
          </p>

          <p style={{textAlign:'center',marginTop:16,fontSize:11,color:'var(--text3)'}}>
            By continuing you agree to POWERSTAR's Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
