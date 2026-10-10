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
  DollarSign
} from 'lucide-react'
import { ALL_SERVICES, MANPOWER, VEHICLES, RTO, FINANCIAL } from '@/data/services'
import { DISTRICTS } from '@/data/karnataka'
import { useThemeStore } from '@/store/themeStore'

export default function LandingPage() {
  const nav = useNavigate()
  const { isDark, toggleTheme } = useThemeStore()

  const [activeTab, setActiveTab] = useState<'manpower' | 'vehicle' | 'rto' | 'financial'>('manpower')

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
      title: 'UPI Direct Checkout',
      desc: 'Pay seamlessly via Google Pay, PhonePe, Paytm, or BHIM. Zero extra fees.',
      icon: '⚡'
    },
    {
      num: '04',
      title: 'Verified Job Completion',
      desc: 'Technician arrives, starts and completes work verified by customer security OTP.',
      icon: '⭐'
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-white selection:bg-brand-500 selection:text-white">
      {/* ── TOP NAVBAR ── */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-brand-500 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => nav('/auth')}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              Partner Portal
            </button>

            <button
              type="button"
              onClick={() => nav('/auth')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <span>Book Service</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
            Book KYC-verified electricians, plumbers, home cleaning specialists, and goods transport vehicles across all 31 Karnataka districts with 100% secure UPI payments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => nav('/auth')}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold text-sm shadow-brand flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>Explore & Book a Service</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => nav('/auth')}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 hover:border-brand-500 text-slate-800 dark:text-slate-200 font-bold text-sm shadow-subtle transition-colors"
            >
              Join as a Service Partner
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-5 sm:p-6 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-card">
          {STATS.map((s, idx) => {
            const Icon = s.icon
            return (
              <div key={idx} className="p-3 text-center sm:text-left flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-black font-display text-slate-900 dark:text-white">
                    {s.num}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {s.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── SERVICES EXPLORATION TABS ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-20 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-500 font-mono">
            Full Service Catalog
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-white">
            Everything Your Home & Business Needs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Transparent fixed pricing, zero hidden charges, matched by Powerstar dispatch.
          </p>
        </div>

        {/* Catalog Tab Switcher */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 bg-slate-200/80 dark:bg-navy-900 rounded-2xl gap-1 max-w-full overflow-x-auto no-scrollbar">
            {[
              { id: 'manpower', label: '👷 Manpower (20)' },
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
              onClick={() => nav('/auth')}
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
            <span>UPI Verified</span>
            <span>•</span>
            <span>31 Districts Covered</span>
            <span>•</span>
            <span>Aadhaar KYC Certified</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
