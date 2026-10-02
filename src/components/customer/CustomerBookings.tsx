import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Search,
  Zap,
  ArrowRight,
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getCustomerBookings } from '@/services/api'
import { Booking } from '@/types'
import HeaderBar from '@/components/layout/HeaderBar'
import UpiPaymentModal from '@/components/ui/UpiPaymentModal'
import ReviewModal from '@/components/ui/ReviewModal'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

export default function CustomerBookings() {
  const { profile } = useAuthStore()
  const nav = useNavigate()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'payment_due' | 'completed' | 'cancelled'>('all')
  const [search, setSearch] = useState('')

  // Modal triggers
  const [payModalBooking, setPayModalBooking] = useState<Booking | null>(null)
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null)

  const fetchBookings = async () => {
    const customerId = profile?.id || 'usr_cust_demo'
    setLoading(true)
    const data = await getCustomerBookings(customerId)
    setBookings(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
    const interval = setInterval(fetchBookings, 30000)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ps_bookings_sync_v2') fetchBookings()
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
    }
  }, [profile?.id])

  const filtered = bookings.filter(b => {
    const matchesSearch =
      b.booking_ref.toLowerCase().includes(search.toLowerCase()) ||
      (b.category?.name && b.category.name.toLowerCase().includes(search.toLowerCase())) ||
      b.district.toLowerCase().includes(search.toLowerCase())

    let matchesStatus = true
    if (filter === 'active') {
      matchesStatus = ['pending_admin', 'provider_assigned', 'payment_pending', 'confirmed', 'in_progress'].includes(b.status)
    } else if (filter === 'pending') {
      matchesStatus = b.status === 'pending_admin'
    } else if (filter === 'payment_due') {
      matchesStatus = ['provider_assigned', 'payment_pending'].includes(b.status)
    } else if (filter === 'completed') {
      matchesStatus = b.status === 'completed'
    } else if (filter === 'cancelled') {
      matchesStatus = ['cancelled', 'rejected'].includes(b.status)
    }

    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="My Service Bookings" subtitle="Track progress, UPI payments, and history" showLocation={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-slate-200/80 dark:border-navy-800 shadow-subtle space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by booking ID, service or area..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'active', label: '⚡ Active' },
              { id: 'payment_due', label: '💳 Payment Due' },
              { id: 'pending', label: '⏳ Pending Match' },
              { id: 'completed', label: '✅ Completed' },
              { id: 'cancelled', label: '❌ Cancelled' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === tab.id
                    ? 'bg-brand-500 text-white shadow-brand font-bold'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/6" />
                </div>
                <div className="h-3 bg-slate-200 dark:bg-navy-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-subtle space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-2xl">
              📋
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">No Bookings Found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {search ? 'Try a different search term or filter' : "You haven't requested any services yet."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => nav('/dashboard/book')}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-brand transition-colors"
            >
              Book a Service Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(booking => {
              const isPaymentPending = booking.status === 'provider_assigned' || booking.status === 'payment_pending'
              const isConfirmedOrOngoing = booking.status === 'confirmed' || booking.status === 'in_progress'

              return (
                <div
                  key={booking.id}
                  className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card hover:border-brand-500/50 transition-all space-y-4"
                >
                  {/* Top Bar: Service & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-navy-800 text-brand-500 flex items-center justify-center text-2xl flex-shrink-0">
                        {booking.category?.icon || '⚡'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {booking.category?.name || 'Powerstar Service'}
                          </h3>
                          <span className="font-mono text-[11px] text-slate-400 font-semibold">
                            #{booking.booking_ref}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-500" />
                          <span>{booking.district} • {booking.city}</span>
                        </p>
                      </div>
                    </div>

                    <StatusBadge status={booking.status} />
                  </div>

                  {/* Schedule & Price Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Schedule</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {booking.scheduled_at || 'Scheduled'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Amount</span>
                      <p className="font-extrabold text-brand-600 dark:text-brand-400 text-sm mt-0.5">
                        ₹{booking.total_amount}
                      </p>
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Provider</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                        {booking.provider?.full_name ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {booking.provider.full_name}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Powerstar Assigning…</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Conditional Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => nav(`/dashboard/track?id=${booking.id}`)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-500 flex items-center gap-1 py-1"
                    >
                      <span>View Details & Timeline</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {/* UPI Pay CTA if Provider Assigned */}
                      {isPaymentPending && (
                        <button
                          type="button"
                          onClick={() => setPayModalBooking(booking)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand flex items-center gap-1.5 active:scale-95 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Pay ₹{booking.total_amount} via UPI</span>
                        </button>
                      )}

                      {/* Live Track CTA */}
                      {isConfirmedOrOngoing && (
                        <button
                          type="button"
                          onClick={() => nav(`/dashboard/track?id=${booking.id}`)}
                          className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-blue flex items-center gap-1.5"
                        >
                          <span>Live Track</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Review CTA if Completed */}
                      {booking.status === 'completed' && booking.provider_id && (
                        <button
                          type="button"
                          onClick={() => setReviewModalBooking(booking)}
                          className="px-3.5 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>Rate Service</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* UPI Payment Modal */}
      {payModalBooking && (
        <UpiPaymentModal
          isOpen={!!payModalBooking}
          onClose={() => setPayModalBooking(null)}
          booking={{
            id: payModalBooking.id,
            booking_ref: payModalBooking.booking_ref,
            customer_id: payModalBooking.customer_id,
            provider_id: payModalBooking.provider_id,
            total_amount: payModalBooking.total_amount,
            base_amount: payModalBooking.base_amount,
            platform_fee: payModalBooking.platform_fee,
            gst_amount: payModalBooking.gst_amount,
            category: payModalBooking.category
          }}
          onSuccess={() => {
            fetchBookings()
          }}
        />
      )}

      {/* Review Modal */}
      {reviewModalBooking && reviewModalBooking.provider_id && (
        <ReviewModal
          isOpen={!!reviewModalBooking}
          onClose={() => setReviewModalBooking(null)}
          booking={{
            id: reviewModalBooking.id,
            booking_ref: reviewModalBooking.booking_ref,
            customer_id: reviewModalBooking.customer_id,
            provider_id: reviewModalBooking.provider_id,
            provider: reviewModalBooking.provider,
            category: reviewModalBooking.category
          }}
          onSubmitted={() => {
            fetchBookings()
          }}
        />
      )}
    </div>
  )
}
