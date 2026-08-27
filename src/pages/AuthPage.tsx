import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore, type Role } from '@/store/authStore'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { DISTRICTS } from '@/data/karnataka'
import toast from 'react-hot-toast'

const FEATURES = [
  '4,200+ KYC-verified providers',
  'Live GPS tracking on every booking',
  'Transparent pricing, zero surprises',
  'All 31 Karnataka districts covered',
  'Work guarantee on every service',
  '3-minute average response time',
]

export default function AuthPage() {
  const navigate    = useNavigate()
  const { setProfile } = useAuthStore()
  const [mode, setMode]       = useState<'login'|'register'>('login')
  const [regRole, setRegRole] = useState<Role>('customer')
    const [loading,      setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    email:'', password:'',
    full_name:'', phone:'', district:'Bengaluru Urban',
  })

  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f=>({...f,[k]:e.target.value}))

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()
    if (!email || !form.password) { toast.error('Enter email and password'); return }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: form.password,
      })
      if (error) throw error
      if (!data.user) throw new Error('Login failed')

      let { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).maybeSingle()
      if (profileError) throw profileError
      if (!profile) {
        const repaired = await supabase.rpc('ensure_my_profile')
        if (repaired.error || !repaired.data) throw new Error('Your account profile could not be created. Apply the auth profile migration, then try again.')
        profile = repaired.data
      }
      if (profile.is_active === false) throw new Error('This account is inactive. Please contact support.')

      setProfile(profile)
      toast.success('Welcome back!')
      const dest = profile.role === 'admin' ? '/admin' : profile.role === 'provider' ? '/provider' : '/dashboard'
      navigate(dest, { replace: true })
    } catch (err: any) {
      await supabase.auth.signOut().catch(() => undefined)
      toast.error(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const email = form.email.trim().toLowerCase()
    if (!form.full_name.trim() || !form.phone.trim() || !email || form.password.length < 6) {
      toast.error('Enter a name, phone, valid email, and a password of at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: { data: { full_name:form.full_name.trim(), role:regRole, phone:form.phone.trim(), district:form.district } },
      })
      if (error) throw error
      if (!data.user) throw new Error('Registration failed')

      // The database trigger creates the profile. Do not upsert a role from the client.
      if (!data.session) {
        toast.success('Account created. Check your email to confirm your account.')
        setMode('login')
        setForm(f => ({ ...f, email, password:'' }))
        return
      }

      let { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).maybeSingle()
      if (profileError) throw profileError
      if (!profile) {
        const repaired = await supabase.rpc('ensure_my_profile')
        if (repaired.error || !repaired.data) throw new Error('Account created, but the profile could not be provisioned. Apply the auth profile migration, then sign in again.')
        profile = repaired.data
      }

      setProfile(profile)
      toast.success('Account created! Welcome to POWERSTAR')
      navigate(profile.role === 'provider' ? '/provider' : '/dashboard', { replace:true })
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page" style={{minHeight:'100vh',width:'100%',minWidth:0,display:'flex',background:'var(--bg)'}}>
      {/* Left panel */}
      <div style={{flex:1,background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',padding:'40px 48px',flexDirection:'column',justifyContent:'space-between',position:'relative',overflow:'hidden'}}
        className="auth-left-panel">
        <div style={{position:'absolute',top:-100,right:-100,width:400,height:400,background:'rgba(249,115,22,0.08)',borderRadius:'50%',filter:'blur(80px)',pointerEvents:'none'}} />
        <div style={{position:'absolute',bottom:-80,left:-80,width:300,height:300,background:'rgba(37,99,235,0.08)',borderRadius:'50%',filter:'blur(60px)',pointerEvents:'none'}} />
        <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',justifyContent:'space-between',height:'100%'}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:60}}>
              <div style={{width:44,height:44,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:13,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>⚡</div>
              <div>
                <div style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:20,color:'#f8fafc'}}>POWER<span style={{color:'#f97316'}}>STAR</span></div>
                <div style={{fontSize:11,color:'#64748b',marginTop:1}}>Karnataka City Services</div>
              </div>
            </div>
            <h2 style={{fontSize:34,fontWeight:800,color:'#f8fafc',lineHeight:1.15,fontFamily:'Plus Jakarta Sans,sans-serif',marginBottom:16}}>
              Karnataka's most<br/>trusted <span style={{color:'#f97316'}}>city services</span><br/>platform.
            </h2>
            <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.6,marginBottom:36}}>
              Book verified workers and vehicles instantly.
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {FEATURES.map((f,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,color:'#94a3b8',fontSize:13}}>
                  <div style={{width:18,height:18,background:'rgba(249,115,22,0.15)',borderRadius:50,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:10,color:'#f97316'}}>✓</div>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex',gap:28}}>
            {[['4,200+','Providers'],['31','Districts'],['4.8★','Rating']].map(([v,l],i)=>(
              <div key={i}>
                <div style={{fontSize:20,fontWeight:800,color:'#f97316',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{v}</div>
                <div style={{fontSize:11,color:'#64748b',marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-main-panel" style={{flex:1,minWidth:0,display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 24px',overflowY:'auto'}}>
        <div style={{width:'100%',maxWidth:420}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:28}}>
            <div style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>navigate('/')}>
              <div style={{width:34,height:34,background:'linear-gradient(135deg,#f97316,#ea580c)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>⚡</div>
              <span style={{fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:800,fontSize:15}}>POWER<span style={{color:'#f97316'}}>STAR</span></span>
            </div>
            <ThemeToggle />
          </div>

          <h1 style={{fontSize:24,fontWeight:800,marginBottom:4,fontFamily:'Plus Jakarta Sans,sans-serif'}}>
            {mode==='login'?'Welcome back':'Create account'}
          </h1>
          <p style={{color:'var(--text2)',fontSize:13,marginBottom:20}}>
            {mode==='login'?'Sign in to continue to POWERSTAR':'Join thousands of users across Karnataka'}
          </p>

          {/* Role tabs register */}
          {mode==='register' && (
            <div style={{marginBottom:16}}>
              <p style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:8}}>I want to</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {([['customer','Book Services','👤'],['provider','Offer Services','👷']] as const).map(([r,l,icon])=>(
                  <button key={r} onClick={()=>setRegRole(r as Role)}
                    style={{padding:'12px',borderRadius:12,border:`2px solid ${regRole===r?'var(--brand)':'var(--border)'}`,background:regRole===r?'var(--brand-light)':'var(--bg2)',cursor:'pointer',fontFamily:'Inter,sans-serif',transition:'all 0.2s'}}>
                    <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                    <div style={{fontSize:12,fontWeight:600,color:regRole===r?'var(--brand)':'var(--text)'}}>{l}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={mode==='login'?handleLogin:handleRegister} style={{display:'flex',flexDirection:'column',gap:12}}>
            {mode==='register' && <>
              <div><label className="input-label">Full Name *</label><input className="input" placeholder="Ramesh Kumar" value={form.full_name} onChange={set('full_name')} required /></div>
              <div><label className="input-label">Phone *</label><input className="input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required /></div>
            </>}
            <div><label className="input-label">Email *</label><input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required /></div>
            <div>
              <label className="input-label" htmlFor="auth-password">Password *</label>
              <div style={{ position:'relative' }}>
                <input id="auth-password" className="input" style={{ paddingRight:78 }} type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={set('password')} required minLength={6} autoComplete={mode==='login' ? 'current-password' : 'new-password'} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowPassword(v => !v)} style={{ position:'absolute', right:6, top:5, padding:'5px 8px' }} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            {mode==='register' && (
              <div>
                <label className="input-label">District *</label>
                <select className="input" value={form.district} onChange={set('district')}>
                  {DISTRICTS.map(d=><option key={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn btn-brand" style={{width:'100%',padding:'13px',fontSize:15,marginTop:4}}>
              {loading ? (
                <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <div style={{width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
                  Please wait...
                </span>
              ) : mode==='login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--text2)'}}>
            {mode==='login'?"Don't have an account? ":"Already have an account? "}
            <span style={{color:'var(--brand)',cursor:'pointer',fontWeight:600}} onClick={()=>setMode(m=>m==='login'?'register':'login')}>
              {mode==='login'?'Register free':'Sign in'}
            </span>
          </p>
        </div>
      </div>
      <style>{`
        .auth-page { width:100%; min-width:0; }
        .auth-left-panel { display: flex !important; min-width:0; }
        .auth-main-panel { min-width:0; }
        @media(max-width:860px){
          .auth-left-panel{ display:none !important; }
          .auth-main-panel{ width:100%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
