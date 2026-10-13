import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  Users,
  Search,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Lock,
  User,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react'
import { ALL_SERVICES } from '@/data/services'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore, Role } from '@/store/authStore'
import { authService } from '@/services/authService'
import AuthModal from '@/components/auth/AuthModal'

export default function LandingPage() {
  const nav = useNavigate()
  const { isDark, toggleTheme } = useThemeStore()
  const { profile } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'manpower' | 'vehicle' | 'rto' | 'financial'>('manpower')

  // Auth Modal States for Login & Registration
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login')
  const [authModalRole, setAuthModalRole] = useState<Role>('customer')

  const STATS = [
    { num: '31', label: 'Karnataka Districts', icon: MapPin },
    { num: '4,200+', label: 'KYC-Verified Technicians', icon: ShieldCheck },
    { num: '98.6%', label: 'On-Time Dispatch Rate', icon: Clock },
    { num: '4.9★', label: 'Average Customer Rating', icon: Star },
  ]

  const WORKFLOW_STEPS = [
    {
      num: '01',
      title: 'Choose Service & Address',
      desc: 'Pick your required service, date, and Karnataka location in 30 seconds.',
      icon: '📝'
    },
    {
      num: '02',
      title: 'Admin Match & Dispatch',
      desc: 'Powerstar admin assigns the best certified professional based on skill & proximity.',
      icon: '👷'
    },
    {
      num: '03',
      title: 'Razorpay Instant ₹11 Token',
      desc: 'Pay a nominal ₹11 booking fee via UPI, Cards, or NetBanking to confirm dispatch.',
      icon: '⚡'
    },
    {
      num: '04',
      title: 'Verified Job Completion',
      desc: 'Technician arrives, starts and completes work verified by customer security OTP.',
      icon: '⭐'
    },
  ]

  // Open modal in requested mode
  function openAuth(mode: 'login' | 'register', role: Role = 'customer') {
    setAuthModalMode(mode)
    setAuthModalRole(role)
    setAuthModalOpen(true)
  }

  // Handle service book button click
  function handleBookService(serviceId: string) {
    if (profile) {
      nav(`/dashboard/book?category=${serviceId}`)
    } else {
      openAuth('login', 'customer')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white selection:bg-brand-500 selection:text-white">
      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => nav('/')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-brand">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-wider font-display">
                POWER<span className="text-brand-500">STAR</span>
              </span>
              <span className="text-[10px] text-slate-400 block font-semibold -mt-1">
                Karnataka Service Network
              </span>
            </div>
          </div>

          {/* Action Navigation: Theme + Login & Registration */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-brand-500 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* If Logged In: Show Profile & Dashboard CTA */}
            {profile ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs">
                  <div className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center font-bold text-[11px]">
                    {profile.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                    {profile.full_name}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold text-brand-500 bg-brand-500/10 px-1.5 py-0.5 rounded">
                    {profile.role}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (profile.role === 'admin') nav('/admin')
                    else if (profile.role === 'provider') nav('/provider')
                    else nav('/dashboard')
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-all flex items-center gap-1.5"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => authService.signOut()}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* If Not Logged In: Prominent Sign In and Register CTAs */
              <div className="flex items-center gap-2">
                {/* Sign In Button */}
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className="px-3.5 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-navy-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400 bg-white dark:bg-navy-800 transition-all shadow-xs flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-brand-500" />
                  <span>Sign In</span>
                </button>

                {/* Create Account / Register Button */}
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>

                {/* Partner Portal Shortcut */}
                <button
                  type="button"
                  onClick={() => openAuth('register', 'provider')}
                  className="hidden md:inline-flex px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors"
                >
                  Partner Portal
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-r from-brand-500/10 via-primary-500/10 to-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Karnataka's #1 On-Demand Service Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black font-display tracking-tight leading-tight text-slate-900 dark:text-white">
            Certified City Experts <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-brand-500 via-brand-600 to-primary-600 bg-clip-text text-transparent">
              Dispatched to Your Doorstep.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Book KYC-verified electricians, plumbers, home cleaning specialists, and goods transport vehicles across all 31 Karnataka districts with nominal ₹11 booking fees and instant mobile OTP verification.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (profile) nav('/dashboard/book')
                else openAuth('login', 'customer')
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold text-sm shadow-brand flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Explore & Book a Service</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => openAuth('register', 'provider')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-brand-500 text-slate-800 dark:text-slate-200 font-bold text-sm shadow-subtle transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-brand-500" />
              <span>Join as a Service Partner</span>
            </button>
          </div>

          {/* Quick Reassurance Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Realistic Mobile OTP Login</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              <span>Zero Password Hassle</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-500" />
              <span>Flat ₹11 Token Fee</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-5 sm:p-6 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-card">
          {STATS.map((s, idx) => {
            const Icon = s.icon
            return (
              <div key={idx} className="p-3 text-center space-y-1">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-navy-800 text-brand-500 mx-auto flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
                  {s.num}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {s.label}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── SERVICE CATALOG ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500 font-mono">
              Certified Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white mt-1">
              Popular Local Services
            </h2>
          </div>

          {/* Service Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-navy-900 rounded-2xl border border-slate-200/80 dark:border-navy-800 overflow-x-auto max-w-full">
            {[
              { id: 'manpower', label: '⚡ Skilled Manpower (20)' },
              { id: 'vehicle', label: '🚛 Vehicles & Logistics (13)' },
              { id: 'rto', label: '📋 RTO & Legal (5)' },
              { id: 'financial', label: '💰 Financial Services (4)' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_SERVICES.filter(s => s.type === activeTab).map(s => (
            <div
              key={s.id}
              onClick={() => handleBookService(s.id)}
              className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-brand-500/60 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                      {s.name}
                    </h3>
                    {s.nameKn && (
                      <p className="text-xs text-slate-400 font-medium">{s.nameKn}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {s.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Booking Fee</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    ₹11
                  </span>
                </div>

                <span className="text-xs font-bold text-brand-500 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Book <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW POWERSTAR ADMIN DISPATCH WORKS ── */}
      <section className="bg-white dark:bg-navy-900 py-16 px-4 sm:px-6 border-y border-slate-200/80 dark:border-navy-800">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-500 font-mono">
              The Powerstar Difference
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
              Why Customers Trust Our Dispatch Model
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              No guessing which worker is good. Powerstar admin matches the highest-rated verified professional for your specific job.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WORKFLOW_STEPS.map(step => (
              <div
                key={step.num}
                className="p-6 rounded-3xl bg-slate-50 dark:bg-navy-950 border border-slate-200/80 dark:border-navy-800 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="font-mono text-xs font-black text-brand-500 px-2 py-0.5 rounded-md bg-brand-500/10">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Quick Registration Callout Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-brand flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 text-center md:text-left">
              <span className="text-xs uppercase font-black tracking-wider bg-white/20 px-3 py-1 rounded-full inline-block">
                Instant Verification
              </span>
              <h3 className="text-2xl font-black font-display">
                Create Your Account in 30 Seconds with OTP
              </h3>
              <p className="text-xs sm:text-sm text-orange-100 max-w-lg">
                Enter your mobile number, verify the 6-digit SMS code, and instantly hire top-tier technicians across Karnataka.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => openAuth('register')}
                className="px-6 py-3.5 rounded-2xl bg-white text-brand-600 font-extrabold text-xs hover:bg-orange-50 shadow-md transition-all active:scale-95"
              >
                Register Now Free
              </button>
              <button
                type="button"
                onClick={() => openAuth('login')}
                className="px-5 py-3.5 rounded-2xl bg-brand-700/60 hover:bg-brand-700 text-white font-bold text-xs border border-white/20 transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 dark:bg-navy-950 text-white py-12 px-4 sm:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black">
              ⚡
            </div>
            <div>
              <span className="font-black text-base tracking-wider font-display">POWERSTAR</span>
              <p className="text-[10px] text-slate-400">© 2026 Powerstar Platform • Karnataka, India</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <span>TRAI DLT Verified OTP</span>
            <span>•</span>
            <span>Razorpay Secured</span>
            <span>•</span>
            <span>31 Karnataka Districts Covered</span>
          </div>
        </div>
      </footer>

      {/* ── AUTHENTICATION MODAL (LOGIN & REGISTRATION) ── */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        initialRole={authModalRole}
      />
    </div>
  )
}
