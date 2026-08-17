import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '../store/themeStore'
import { useState, useEffect } from 'react'

const SERVICES = [
  { icon:'⚡', name:'Electrician',  desc:'Wiring, repairs, installation',  color:'#f59e0b' },
  { icon:'🔧', name:'Plumber',      desc:'Pipes, leaks, bathroom fitting',  color:'#3b82f6' },
  { icon:'🧱', name:'Mason',        desc:'Brickwork, plastering, tiles',    color:'#8b5cf6' },
  { icon:'🧹', name:'Cleaning',     desc:'Deep clean, housekeeping',        color:'#10b981' },
  { icon:'🚐', name:'Tata Ace',     desc:'Mini truck for goods transport',  color:'#f97316' },
  { icon:'🚗', name:'Driver',       desc:'Personal & commercial driving',   color:'#06b6d4' },
  { icon:'🏗️', name:'JCB / Crane', desc:'Heavy equipment on demand',       color:'#ef4444' },
  { icon:'💪', name:'Loading Help', desc:'Packers, movers, labour',         color:'#84cc16' },
]

const STATS = [
  { val:'4,200+', label:'Verified Providers' },
  { val:'850+',   label:'Vehicles Available' },
  { val:'31',     label:'Karnataka Districts' },
  { val:'4.8★',   label:'Avg. Rating' },
]

export default function LandingPage() {
  const nav  = useNavigate()
  const { dark, toggle } = useThemeStore()
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'var(--bg)',
      overflowX: 'hidden',
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 24px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxSizing: 'border-box', width: '100%',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', flexShrink:0 }} onClick={()=>nav('/')}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 2px 8px rgba(249,115,22,0.4)' }}>⚡</div>
          <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:18, color:'var(--text)', whiteSpace:'nowrap' }}>
            POWER<span style={{ color:'#f97316' }}>STAR</span>
          </span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={toggle} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, padding:'6px 8px', lineHeight:1 }}>{dark?'☀️':'🌙'}</button>
          <button className="btn btn-outline btn-sm" onClick={()=>nav('/auth')} style={{ whiteSpace:'nowrap' }}>Login</button>
          <button className="btn btn-outline btn-sm" onClick={()=>nav('/auth?mode=provider')} style={{ whiteSpace:'nowrap' }}>Join as Provider</button>
          <button className="btn btn-brand btn-sm" onClick={()=>nav('/auth')} style={{ whiteSpace:'nowrap' }}>Book a Service</button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position:'fixed', top:64, left:0, right:0, background:'var(--card)', borderBottom:'1px solid var(--border)', zIndex:99, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
          <button className="btn btn-outline" style={{ width:'100%' }} onClick={()=>{nav('/auth');setMenuOpen(false)}}>Login</button>
          <button className="btn btn-outline" style={{ width:'100%' }} onClick={()=>{nav('/auth?mode=provider');setMenuOpen(false)}}>Join as Provider</button>
          <button className="btn btn-brand" style={{ width:'100%' }} onClick={()=>{nav('/auth');setMenuOpen(false)}}>Book a Service</button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ paddingTop:110, paddingBottom:64, paddingLeft:24, paddingRight:24, textAlign:'center', width:'100%', boxSizing:'border-box', background:'linear-gradient(180deg,rgba(249,115,22,0.03) 0%,transparent 100%)' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:20, padding:'6px 14px', marginBottom:24, fontSize:13, fontWeight:600, color:'#f97316' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a', animation:'blink 2s ease-in-out infinite', flexShrink:0 }}/>
          4,200+ workers live across Karnataka
        </div>

        <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:900, lineHeight:1.1, marginBottom:20, color:'var(--text)', fontSize:'clamp(36px,6vw,72px)' }}>
          City workers,<br/>
          <span style={{ color:'#f97316' }}>on demand.</span><br/>
          Across Karnataka.
        </h1>

        <p style={{ fontSize:'clamp(14px,2vw,18px)', color:'var(--text2)', marginBottom:36, maxWidth:540, margin:'0 auto 36px', lineHeight:1.7 }}>
          Book verified electricians, plumbers, drivers & transport vehicles. Transparent pricing, live GPS, KYC-verified providers.
        </p>

        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-brand" style={{ padding:'14px 32px', fontSize:16, borderRadius:12 }} onClick={()=>nav('/auth')}>Get Started Free →</button>
          <button className="btn btn-outline" style={{ padding:'14px 32px', fontSize:16, borderRadius:12 }} onClick={()=>nav('/auth?mode=provider')}>Join as Provider</button>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding:'0 24px 56px', width:'100%', boxSizing:'border-box' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, maxWidth:900, margin:'0 auto' }}>
          {STATS.map((s,i)=>(
            <div key={i} style={{ background:'var(--card)', borderRadius:16, padding:'24px 16px', textAlign:'center', border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(22px,3vw,36px)', fontWeight:900, color:'#f97316', marginBottom:6 }}>{s.val}</p>
              <p style={{ fontSize:13, color:'var(--text2)', fontWeight:500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ padding:'0 24px 64px', width:'100%', boxSizing:'border-box' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>QUICK FIND</p>
          <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'clamp(24px,4vw,42px)', color:'var(--text)', marginBottom:8 }}>Find what you need</h2>
          <p style={{ color:'var(--text2)', fontSize:15 }}>Search 4,200+ providers across all 31 Karnataka districts</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, maxWidth:900, margin:'0 auto' }}>
          {SERVICES.map((s,i)=>(
            <div key={i} onClick={()=>nav('/auth')}
              style={{ background:'var(--card)', borderRadius:16, padding:'22px 14px', textAlign:'center', cursor:'pointer', border:'1px solid var(--border)', transition:'all 0.2s' }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-3px)';el.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow=''}}>
              <div style={{ width:52, height:52, borderRadius:14, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, margin:'0 auto 12px' }}>{s.icon}</div>
              <p style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:4 }}>{s.name}</p>
              <p style={{ fontSize:11, color:'var(--text3)', lineHeight:1.4 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'56px 24px', width:'100%', boxSizing:'border-box', background:'var(--bg2)' }}>
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>HOW IT WORKS</p>
          <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'clamp(24px,4vw,40px)', color:'var(--text)' }}>3 simple steps</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:20, maxWidth:900, margin:'0 auto' }}>
          {[
            { n:'01', icon:'📍', title:'Choose service', desc:'Pick from 42+ verified services across manpower and transport.' },
            { n:'02', icon:'👷', title:'Match provider', desc:'We connect you with a KYC-verified provider in your district instantly.' },
            { n:'03', icon:'✅', title:'Pay after job', desc:'Provider completes work, you verify with OTP, then pay securely.' },
          ].map((s,i)=>(
            <div key={i} style={{ background:'var(--card)', borderRadius:16, padding:28, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <span style={{ fontSize:13, fontWeight:900, color:'#f97316', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.n}</span>
                <span style={{ fontSize:30 }}>{s.icon}</span>
              </div>
              <p style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>{s.title}</p>
              <p style={{ color:'var(--text2)', fontSize:14, lineHeight:1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'56px 24px', width:'100%', boxSizing:'border-box', background:'linear-gradient(135deg,#f97316,#ea580c)', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:900, fontSize:'clamp(24px,4vw,40px)', color:'#fff', marginBottom:12 }}>Ready to get started?</h2>
        <p style={{ color:'rgba(255,255,255,0.85)', fontSize:16, marginBottom:32 }}>Join 4,200+ providers and thousands of customers across Karnataka.</p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={()=>nav('/auth')} style={{ background:'#fff', color:'#f97316', border:'none', borderRadius:12, padding:'14px 32px', fontSize:16, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Book a Service →</button>
          <button onClick={()=>nav('/auth?mode=provider')} style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'2px solid rgba(255,255,255,0.4)', borderRadius:12, padding:'14px 32px', fontSize:16, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>Join as Provider</button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#0f172a', color:'rgba(255,255,255,0.6)', padding:'36px 24px', textAlign:'center', width:'100%', boxSizing:'border-box' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:14 }}>
          <div style={{ width:30, height:30, background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>⚡</div>
          <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:17, color:'#fff' }}>POWER<span style={{ color:'#f97316' }}>STAR</span></span>
        </div>
        <p style={{ fontSize:13, marginBottom:8 }}>Karnataka's city services platform — connecting workers with opportunities.</p>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>© 2026 POWERSTAR. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @media(max-width:767px){
          nav > div:last-child > .btn-outline:not(:last-child) { display: none }
        }
        @media(max-width:500px){
          nav > div:last-child > button:not(.btn-brand) { display: none }
        }
      `}</style>
    </div>
  )
}
