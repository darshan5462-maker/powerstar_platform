import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  Star,
  Activity,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ChevronRight,
  Award,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ALL_SERVICES, MANPOWER, VEHICLES, RTO, FINANCIAL, Service } from '@/data/services'
import { getCustomerBookings } from '@/services/api'
import { Booking } from '@/types'
import HeaderBar from '@/components/layout/HeaderBar'

export default function CustomerHome() {
  const { profile } = useAuthStore()
  const nav = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'manpower' | 'vehicle' | 'rto' | 'financial'>('all')
  const [activeBookings, setActiveBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.full_name?.split(' ')[0] || 'Friend'

  useEffect(() => {
    const customerId = profile?.id || 'usr_cust_demo'
    const fetchActive = async () => {
      setLoading(true)
      const data = await getCustomerBookings(customerId)
      const ongoing = data.filter(b =>
        ['pending_admin', 'provider_assigned', 'payment_pending', 'confirmed', 'in_progress'].includes(b.status)
      )
      setActiveBookings(ongoing)
      setLoading(false)
    }
    fetchActive()
    const interval = setInterval(fetchActive, 30000)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ps_bookings_sync_v2') fetchActive()
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
    }
  }, [profile?.id])

  // Filter services by search & category
  const filteredServices = ALL_SERVICES.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nameKn && s.nameKn.includes(searchQuery))
    const matchesType = selectedTypeFilter === 'all' || s.type === selectedTypeFilter
    return matchesSearch && matchesType
  })

  // Quick category shortcuts
  const CATEGORY_CARDS = [
    { title: 'Electrician', icon: '⚡', slug: 'electrician', color: '#f59e0b', bg: '#fef3c7', tag: 'Fast 30m' },
    { title: 'Plumbing', icon: '🔧', slug: 'plumber', color: '#3b82f6', bg: '#dbeafe', tag: 'Popular' },
    { title: 'Cleaning', icon: '🧹', slug: 'cleaning', color: '#10b981', bg: '#d1fae5', tag: 'Deep Clean' },
    { title: 'Masonry', icon: '🧱', slug: 'mason', color: '#8b5cf6', bg: '#ede9fe', tag: 'Verified' },
    { title: 'Tata Ace', icon: '🚐', slug: 'tata-ace', color: '#f97316', bg: '#ffedd5', tag: '750kg Goods' },
    { title: 'Driver', icon: '🚗', slug: 'driver', color: '#06b6d4', bg: '#cffafe', tag: '24x7 Available' },
    { title: 'Construction', icon: '👷', slug: 'construction', color: '#6366f1', bg: '#e0e7ff', tag: 'Labor' },
    { title: 'All Services', icon: '✨', slug: 'all', color: '#ec4899', bg: '#fce7f3', tag: '37+ Categories' },
  ]

  // Promotional Banners
  const OFFERS = [
    {
      title: 'Powerstar Verified Pros',
      subtitle: 'Technicians assigned by admin based on skill & location',
      cta: 'Explore Services',
      bg: 'from-navy-900 to-navy-800 text-white border-navy-700',
      tag: 'Guaranteed Matching',
      icon: ShieldCheck
    },
    {
      title: '100% Secure UPI Checkout',
      subtitle: 'Pay via Google Pay, PhonePe, Paytm or BHIM after provider assignment',
      cta: 'Book Now',
      bg: 'from-brand-600 to-brand-700 text-white border-brand-500',
      tag: 'Zero Convenience Fees',
      icon: Zap
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-20 lg:pb-10">
      <HeaderBar showLocation={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-6">
        {/* ── 1. GREETING & HERO SEARCH SECTION ── */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 text-white p-6 sm:p-8 shadow-xl border border-navy-700/60">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-60 h-60 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/40 text-brand-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{greeting}, {firstName} 👋</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white mb-2 leading-tight">
              What service do you need today?
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mb-6">
              Book certified manpower, commercial vehicles, and home experts across Karnataka.
            </p>

            {/* Live Search Bar */}
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search plumbing, electrician, AC repair, cleaning, Tata Ace..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-navy-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium shadow-lg border border-transparent focus:border-brand-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── 2. ACTIVE BOOKING LIVE TRACKING BANNER (IF ANY) ── */}
        {activeBookings.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 pulse-badge" />
                Active Service Requests ({activeBookings.length})
              </h2>
              <button
                type="button"
                onClick={() => nav('/dashboard/track')}
                className="text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline flex items-center gap-1"
              >
                Track Live <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeBookings.slice(0, 2).map(bk => (
                <div
                  key={bk.id}
                  onClick={() => nav('/dashboard/track')}
                  className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-brand-500/30 shadow-card hover:border-brand-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-xl flex-shrink-0">
                      {bk.category?.icon || '⚡'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {bk.category?.name || 'Powerstar Service'}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">#{bk.booking_ref}</span>
                      </div>
                      <p className="text-xs font-semibold mt-0.5 text-brand-600 dark:text-brand-400">
                        {bk.status === 'pending_admin' && '⏳ Powerstar matching your technician…'}
                        {bk.status === 'provider_assigned' && '👷 Provider Assigned! Tap to pay via UPI'}
                        {bk.status === 'payment_pending' && '💳 Payment Required via UPI'}
                        {bk.status === 'confirmed' && '✅ Booking Confirmed • Scheduled'}
                        {bk.status === 'in_progress' && '🔧 Service In Progress'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      ₹{bk.total_amount}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── 3. POPULAR CATEGORIES HORIZONTAL & GRID ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">
                Explore Categories
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified professionals assigned by Powerstar admin
              </p>
            </div>
            <button
              type="button"
              onClick={() => nav('/dashboard/book')}
              className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              See All <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3.5">
            {CATEGORY_CARDS.map(cat => (
              <div
                key={cat.slug}
                onClick={() => {
                  if (cat.slug === 'all') {
                    nav('/dashboard/book')
                  } else {
                    nav(`/dashboard/book?category=${cat.slug}`)
                  }
                }}
                className="group flex flex-col items-center p-3 sm:p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-brand-500/60 shadow-subtle hover:shadow-card transition-all cursor-pointer text-center active:scale-95"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-transform group-hover:scale-110 shadow-sm"
                  style={{ backgroundColor: cat.bg }}
                >
                  <span>{cat.icon}</span>
                </div>
                <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate w-full">
                  {cat.title}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium truncate w-full mt-0.5">
                  {cat.tag}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. FILTER TABS & SERVICE CATALOG SEARCH ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'all', label: 'All Services (42)' },
              { id: 'manpower', label: '👷 Manpower & Labor (20)' },
              { id: 'vehicle', label: '🚛 Vehicles & Logistics (13)' },
              { id: 'rto', label: '📋 RTO & Legal (5)' },
              { id: 'financial', label: '💰 Financial (4)' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTypeFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedTypeFilter === tab.id
                    ? 'bg-brand-500 text-white shadow-brand font-bold'
                    : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-800 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.slice(0, 9).map(service => (
              <div
                key={service.id}
                onClick={() => nav(`/dashboard/book?category=${service.id}`)}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 hover:border-brand-500/60 shadow-card hover:shadow-card-hover transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform flex-shrink-0">
                        {service.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                            {service.name}
                          </h3>
                          {service.available24h && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              24/7
                            </span>
                          )}
                        </div>
                        {service.nameKn && (
                          <p className="text-[11px] text-slate-400 font-medium">{service.nameKn}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                    {service.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Booking Fee</span>
                    <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹11
                    </span>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-bold group-hover:bg-brand-500 group-hover:text-white transition-all flex items-center gap-1"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. VALUE PROPOSITIONS & TRUST BANNER ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {OFFERS.map((offer, idx) => {
            const Icon = offer.icon
            return (
              <div
                key={idx}
                className={`p-6 rounded-3xl bg-gradient-to-br ${offer.bg} border shadow-lg relative overflow-hidden flex flex-col justify-between`}
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 uppercase tracking-wider">
                      {offer.tag}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold font-display mb-1">{offer.title}</h3>
                  <p className="text-xs text-slate-200 mb-4 max-w-sm">{offer.subtitle}</p>
                </div>

                <div className="flex items-center justify-between relative z-10">
                  <button
                    type="button"
                    onClick={() => nav('/dashboard/book')}
                    className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    {offer.cta}
                  </button>
                  <Icon className="w-12 h-12 text-white/20" />
                </div>
              </div>
            )
          })}
        </section>

        {/* ── 6. POWERSTAR WORKFLOW REASSURANCE ── */}
        <section className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-card space-y-4">
          <div className="text-center max-w-lg mx-auto">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              How Powerstar On-Demand Works
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Guaranteed technician quality through verified admin matching
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            {[
              { step: '1', title: 'Submit Request', desc: 'Pick service, select time and address', icon: '📝' },
              { step: '2', title: 'Admin Match', desc: 'Powerstar assigns verified local pro', icon: '👷' },
              { step: '3', title: 'UPI Payment', desc: 'Pay securely after pro is assigned', icon: '⚡' },
              { step: '4', title: 'Job Done', desc: 'Verified service & OTP confirmation', icon: '⭐' },
            ].map(item => (
              <div key={item.step} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/50 border border-slate-200/60 dark:border-navy-700/60">
                <span className="text-2xl mb-1 block">{item.icon}</span>
                <span className="text-[10px] font-bold text-brand-500 font-mono">STEP {item.step}</span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">{item.title}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
