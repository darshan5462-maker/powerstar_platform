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
  const nav          = useNavigate()
  const { dark, toggle } = useThemeStore()
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', overflowX:'hidden', maxWidth:'100vw' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : 'none',
        transition: 'all 0.3s ease',
        padding:'0 20px', height:60,
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={()=>nav('/')}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, boxShadow:'0 2px 8px rgba(249,115,22,0.4)', flexShrink:0 }}>⚡</div>
          <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:18, color:'var(--text)' }}>
            POWER<span style={{ color:'#f97316' }}>STAR</span>
          </span>
        </div>

        {/* Desktop nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }} className="desktop-nav">
          <button onClick={toggle} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, padding:'6px 8px' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={()=>nav('/auth')}>Login</button>
          <button className="btn btn-outline btn-sm" onClick={()=>nav('/auth?mode=provider')}>Join as Provider</button>
          <button className="btn btn-brand btn-sm" onClick={()=>nav('/auth')}>Book a Service</button>
        </div>

        {/* Mobile hamburger */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }} className="mobile-nav-icons">
          <button onClick={toggle} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, padding:'6px' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={()=>setMenuOpen(m=>!m)}
            style={{ background:'none', border:'1.5px solid var(--border)', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:16, color:'var(--text)' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position:'fixed', top:60, left:0, right:0, background:'var(--card)', borderBottom:'1px solid var(--border)', zIndex:99, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
          <button className="btn btn-outline" style={{ width:'100%' }} onClick={()=>{nav('/auth');setMenuOpen(false)}}>Login</button>
          <button className="btn btn-outline" style={{ width:'100%' }} onClick={()=>{nav('/auth?mode=provider');setMenuOpen(false)}}>Join as Provider</button>
          <button className="btn btn-brand"  style={{ width:'100%' }} onClick={()=>{nav('/auth');setMenuOpen(false)}}>Book a Service</button>
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ paddingTop:100, paddingBottom:60, paddingLeft:20, paddingRight:20, textAlign:'center', background:'linear-gradient(180deg,rgba(249,115,22,0.04) 0%,transparent 100%)' }}>
        {/* Badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(249,115,22,0.08)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:20, padding:'6px 14px', marginBottom:24, fontSize:13, fontWeight:600, color:'#f97316' }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#16a34a', animation:'blink 2s ease-in-out infinite' }}/>
          4,200+ workers live across Karnataka
        </div>

        <h1 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:900, lineHeight:1.1, marginBottom:20, color:'var(--text)',
          fontSize:'clamp(32px,8vw,72px)' }}>
          City workers,<br/>
          <span style={{ color:'#f97316' }}>on demand.</span><br/>
          Across Karnataka.
        </h1>

        <p style={{ fontSize:'clamp(14px,4vw,18px)', color:'var(--text2)', marginBottom:32, maxWidth:520, margin:'0 auto 32px', lineHeight:1.6 }}>
          Book verified electricians, plumbers, drivers & transport vehicles. Transparent pricing, live GPS, KYC-verified providers.
        </p>

        {/* CTA buttons */}
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button className="btn btn-brand" style={{ padding:'14px 28px', fontSize:16, borderRadius:12 }} onClick={()=>nav('/auth')}>
            Get Started Free →
          </button>
          <button className="btn btn-outline" style={{ padding:'14px 28px', fontSize:16, borderRadius:12 }} onClick={()=>nav('/auth?mode=provider')}>
            Join as Provider
          </button>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding:'0 16px 48px', overflowX:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, minWidth:280, maxWidth:800, margin:'0 auto' }}
          className="stats-grid">
          {STATS.map((s,i) => (
            <div key={i} style={{ background:'var(--card)', borderRadius:14, padding:'20px 12px', textAlign:'center', border:'1px solid var(--border)', boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:'clamp(20px,5vw,32px)', fontWeight:900, color:'#f97316', marginBottom:4 }}>{s.val}</p>
              <p style={{ fontSize:'clamp(10px,3vw,13px)', color:'var(--text2)', fontWeight:500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ padding:'0 16px 60px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>QUICK FIND</p>
          <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'clamp(22px,6vw,40px)', color:'var(--text)', marginBottom:8 }}>
            Find what you need
          </h2>
          <p style={{ color:'var(--text2)', fontSize:'clamp(13px,3.5vw,16px)' }}>Search 4,200+ providers across all 31 Karnataka districts</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, maxWidth:800, margin:'0 auto' }}>
          {SERVICES.map((s,i) => (
            <div key={i} onClick={()=>nav('/auth')}
              style={{ background:'var(--card)', borderRadius:16, padding:'20px 12px', textAlign:'center', cursor:'pointer', border:'1px solid var(--border)', transition:'all 0.2s' }}
              onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-3px)';el.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'}}
              onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='';el.style.boxShadow=''}}>
              <div style={{ width:48, height:48, borderRadius:14, background:`${s.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, margin:'0 auto 10px' }}>{s.icon}</div>
              <p style={{ fontWeight:700, fontSize:13, color:'var(--text)', marginBottom:4 }}>{s.name}</p>
              <p style={{ fontSize:11, color:'var(--text3)', lineHeight:1.3 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'48px 20px 60px', background:'var(--bg2)' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#f97316', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>HOW IT WORKS</p>
          <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:'clamp(22px,6vw,36px)', color:'var(--text)' }}>3 simple steps</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:20, maxWidth:800, margin:'0 auto' }}>
          {[
            { step:'01', icon:'📍', title:'Choose your service', desc:'Pick from 42+ verified services across manpower and transport.' },
            { step:'02', icon:'👷', title:'Match with provider', desc:'We connect you with a KYC-verified provider in your district instantly.' },
            { step:'03', icon:'✅', title:'Job done, pay later', desc:'Provider completes work, you verify with OTP, then pay securely.' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--card)', borderRadius:16, padding:24, border:'1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <span style={{ fontSize:11, fontWeight:900, color:'#f97316', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.step}</span>
                <span style={{ fontSize:28 }}>{s.icon}</span>
              </div>
              <p style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{s.title}</p>
              <p style={{ color:'var(--text2)', fontSize:13, lineHeight:1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding:'48px 20px', background:'linear-gradient(135deg,#f97316,#ea580c)', textAlign:'center' }}>
        <h2 style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:900, fontSize:'clamp(22px,6vw,36px)', color:'#fff', marginBottom:12 }}>
          Ready to get started?
        </h2>
        <p style={{ color:'rgba(255,255,255,0.85)', fontSize:'clamp(13px,3.5vw,16px)', marginBottom:28 }}>
          Join 4,200+ providers and thousands of customers across Karnataka.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={()=>nav('/auth')}
            style={{ background:'#fff', color:'#f97316', border:'none', borderRadius:12, padding:'13px 28px', fontSize:15, fontWeight:800, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Book a Service →
          </button>
          <button onClick={()=>nav('/auth?mode=provider')}
            style={{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'2px solid rgba(255,255,255,0.4)', borderRadius:12, padding:'13px 28px', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            Join as Provider
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#0f172a', color:'rgba(255,255,255,0.6)', padding:'32px 20px', textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:16 }}>
          <div style={{ width:28, height:28, background:'linear-gradient(135deg,#f97316,#ea580c)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>⚡</div>
          <span style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:16, color:'#fff' }}>POWER<span style={{ color:'#f97316' }}>STAR</span></span>
        </div>
        <p style={{ fontSize:13, marginBottom:8 }}>Karnataka's city services platform — connecting workers with opportunities.</p>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>© 2026 POWERSTAR. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @media(max-width:767px){
          .desktop-nav { display:none !important }
          .mobile-nav-icons { display:flex !important }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important }
        }
        @media(min-width:768px){
          .desktop-nav { display:flex !important }
          .mobile-nav-icons { display:none !important }
        }
      `}</style>
    </div>
  )
}
