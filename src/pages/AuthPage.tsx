import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  ArrowRight,
  Sun,
  Moon
} from 'lucide-react'
import { useAuthStore, Role } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { signIn, signUp } from '@/services/authService'
import { DISTRICTS } from '@/data/karnataka'
import toast from 'react-hot-toast'

const DEMO_LOGINS = [
  { role: 'customer' as Role, email: 'customer@demo.com', pwd: 'demo1234', label: 'Customer Demo', icon: '👤', badge: 'Book Services' },
  { role: 'provider' as Role, email: 'provider@demo.com', pwd: 'demo1234', label: 'Provider Demo', icon: '👷', badge: 'Receive Jobs' },
]

export default function AuthPage() {
  const { profile } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [role, setRole] = useState<Role>('customer')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: 'customer@demo.com',
    password: 'demo1234',
    full_name: '',
    phone: '',
    district: 'Bengaluru Urban'
  })

  useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') navigate('/admin', { replace: true })
      else if (profile.role === 'provider') navigate('/provider', { replace: true })
      else navigate('/dashboard', { replace: true })
    }
  }, [profile, navigate])

  function fillDemo(d: typeof DEMO_LOGINS[0]) {
    setRole(d.role)
    setMode('login')
    setForm(f => ({ ...f, email: d.email, password: d.pwd }))
    toast.success(`Loaded ${d.label} credentials`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(form.email, form.password)
        toast.success('Welcome back to POWERSTAR!')
      } else {
        if (!form.full_name.trim() || !form.phone.trim()) {
          toast.error('Please enter your full name and phone number')
          return
        }
        await signUp({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          phone: form.phone,
          role,
          district: form.district
        })
        toast.success('Account created! Welcome to POWERSTAR 🎉')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Authentication error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Home & Theme Switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-brand-500 transition-colors shadow-sm"
        >
          ← Home Page
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-navy-700 shadow-sm"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 relative z-10">
        <div
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2.5 cursor-pointer mb-3"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-brand">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-black tracking-wider text-slate-900 dark:text-white font-display">
            POWER<span className="text-brand-500">STAR</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Karnataka's On-Demand Local Services Marketplace
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0 relative z-10">
        {/* Quick Demo Selector */}
        <div className="mb-4 p-3 rounded-2xl bg-slate-100/90 dark:bg-navy-900/90 border border-slate-200 dark:border-navy-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
            <span>⚡ Instant 1-Click Demo Login</span>
            <span className="text-emerald-500 font-semibold">Ready</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_LOGINS.map(d => (
              <button
                key={d.role}
                type="button"
                onClick={() => fillDemo(d)}
                className="p-2.5 rounded-xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 hover:border-brand-500 text-left transition-all group flex flex-col justify-between shadow-xs active:scale-95"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{d.icon}</span>
                  <span className="text-[9px] font-bold uppercase text-brand-500 font-mono">{d.role}</span>
                </div>
                <p className="font-bold text-[11px] text-slate-900 dark:text-white truncate">{d.label.split(' ')[0]}</p>
                <span className="text-[9px] text-slate-400 truncate">{d.badge}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-navy-900 py-8 px-6 sm:px-8 shadow-card rounded-3xl border border-slate-200/80 dark:border-navy-800">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-navy-800 p-1 rounded-2xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role selector in register mode */}
          {mode === 'register' && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Join Powerstar As
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { r: 'customer' as Role, label: '👤 Customer', sub: 'Book Services' },
                  { r: 'provider' as Role, label: '👷 Service Provider', sub: 'Receive Jobs' },
                ].map(item => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => setRole(item.r)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      role === item.r
                        ? 'bg-brand-50/70 dark:bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                        : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="e.g. Ramesh Patil"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91 98450 00000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary District (Karnataka)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <select
                      value={form.district}
                      onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      {DISTRICTS.map(d => (
                        <option key={d.id} value={d.name}>{d.name} {d.nameKn ? `(${d.nameKn})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 mt-2"
            >
              <span>{loading ? 'Authenticating…' : mode === 'login' ? 'Sign In to Powerstar' : 'Create My Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
