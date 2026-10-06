import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Zap,
  ArrowRight,
  Star,
  Activity,
  AlertCircle,
  KeyRound,
  FileText
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getCustomerBookings } from '@/services/api'
import { Booking } from '@/types'
import HeaderBar from '@/components/layout/HeaderBar'
import UpiPaymentModal from '@/components/ui/UpiPaymentModal'
import ReviewModal from '@/components/ui/ReviewModal'
import { StatusBadge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'

const TIMELINE_STEPS = [
  { id: 'pending_admin', label: 'Request Received', desc: 'Powerstar admin matching technician' },
  { id: 'provider_assigned', label: 'Provider Assigned', desc: 'Verified local expert selected' },
  { id: 'confirmed', label: 'UPI Payment Confirmed', desc: 'Booking locked & scheduled' },
  { id: 'in_progress', label: 'Service In Progress', desc: 'Technician on-site doing work' },
  { id: 'completed', label: 'Service Completed', desc: 'Work verified & completed' },
]

export default function CustomerTrack() {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedId = searchParams.get('id')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(requestedId)
  const [loading, setLoading] = useState(true)

  // Payment & Review Modals
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  const loadBookings = useCallback(async (isBackground = false) => {
    if (!profile?.id) return
    if (!isBackground) setLoading(true)
    const data = await getCustomerBookings(profile.id)
    setBookings(data)

    if (data.length > 0) {
      if (requestedId && data.some(b => b.id === requestedId || b.booking_ref === requestedId)) {
        setSelectedBookingId(requestedId)
      } else if (!selectedBookingId || !data.some(b => b.id === selectedBookingId || b.booking_ref === selectedBookingId)) {
        // Default to first active or first booking
        const active = data.find(b =>
          ['pending_admin', 'provider_assigned', 'payment_pending', 'confirmed', 'in_progress'].includes(b.status)
        )
        setSelectedBookingId(active ? active.id : data[0].id)
      }
    }
    if (!isBackground) setLoading(false)
  }, [profile?.id, requestedId, selectedBookingId])

  useEffect(() => {
    loadBookings()

    // 1. Fast 3-second auto-poll for real-time mobile sync
    const interval = setInterval(() => loadBookings(true), 3000)

    // 2. Storage event sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ps_bookings_sync_v2') loadBookings(true)
    }
    window.addEventListener('storage', handleStorage)

    // 3. Supabase Realtime channel for instant DB updates
    const channel = supabase
      .channel('cust-track-live-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          loadBookings(true)
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
      supabase.removeChannel(channel)
    }
  }, [loadBookings])

  const currentBooking = bookings.find(b => b.id === selectedBookingId || b.booking_ref === selectedBookingId) || bookings[0]

  // Determine active step index
  const getStepIndex = (status: string) => {
    if (status === 'pending_admin') return 0
    if (status === 'provider_assigned' || status === 'payment_pending') return 1
    if (status === 'payment_success' || status === 'confirmed') return 2
    if (status === 'in_progress') return 3
    if (status === 'completed') return 4
    return 0
  }

  const currentStepIdx = currentBooking ? getStepIndex(currentBooking.status) : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Service Tracker" subtitle="Live updates on dispatch, payment & job status" showLocation={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {loading ? (
          <div className="p-8 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 animate-pulse">
            <div className="h-6 bg-slate-200 dark:bg-navy-700 rounded w-1/3 mx-auto mb-4" />
            <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/2 mx-auto" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-subtle space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-2xl">
              📍
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">No Active Tracking</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                You do not have any active service requests right now.
              </p>
            </div>
            <button
              type="button"
              onClick={() => nav('/dashboard/book')}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-brand transition-colors"
            >
              Book a Service
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Multiple Bookings Switcher Pill Bar if > 1 */}
            {bookings.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {bookings.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBookingId(b.id)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border ${
                      selectedBookingId === b.id
                        ? 'bg-brand-500 text-white border-brand-500 shadow-brand font-bold'
                        : 'bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-800'
                    }`}
                  >
                    <span>{b.category?.icon || '⚡'}</span>
                    <span>#{b.booking_ref}</span>
                    <span className="text-[10px] opacity-80 uppercase">({b.status.replace('_', ' ')})</span>
                  </button>
                ))}
              </div>
            )}

            {currentBooking && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── LEFT 2 COLS: TIMELINE & ACTIONS ── */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Status Card Header */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{currentBooking.category?.icon || '⚡'}</span>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                            {currentBooking.category?.name || 'Powerstar Service'}
                          </h2>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Booking ID: #{currentBooking.booking_ref} • {currentBooking.district}
                        </p>
                      </div>
                      <StatusBadge status={currentBooking.status} />
                    </div>

                    {/* Action Alert Banner */}
                    {(currentBooking.status === 'provider_assigned' || currentBooking.status === 'payment_pending') && (
                      <div className="p-4 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-sm shadow-brand flex-shrink-0">
                            UPI
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                              Provider Assigned! UPI Payment Required
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Amount: ₹{currentBooking.total_amount} • 100% Secure via GPay, PhonePe, Paytm
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPayModalOpen(true)}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand flex items-center justify-center gap-1.5 active:scale-95 transition-all flex-shrink-0"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Pay ₹{currentBooking.total_amount} Now</span>
                        </button>
                      </div>
                    )}

                    {/* Completed Banner */}
                    {currentBooking.status === 'completed' && currentBooking.provider_id && (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <div>
                            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Job Completed!</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Please rate your experience with {currentBooking.provider?.full_name || 'technician'}.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setReviewModalOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                        >
                          <Star className="w-3.5 h-3.5 fill-white" />
                          <span>Rate Service</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Progressive Timeline Tracker */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-5">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Live Order Milestones
                    </h3>

                    <div className="space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-navy-700">
                      {TIMELINE_STEPS.map((step, idx) => {
                        const isDone = currentStepIdx > idx
                        const isCurrent = currentStepIdx === idx
                        return (
                          <div key={step.id} className="relative flex items-start gap-4">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all flex-shrink-0 ${
                                isDone
                                  ? 'bg-emerald-500 text-white shadow-sm'
                                  : isCurrent
                                  ? 'bg-brand-500 text-white ring-4 ring-brand-500/20 pulse-badge'
                                  : 'bg-slate-100 dark:bg-navy-800 text-slate-400 border border-slate-200 dark:border-navy-700'
                              }`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </div>
                            <div className="flex-1">
                              <h4
                                className={`text-xs font-bold ${
                                  isCurrent
                                    ? 'text-brand-600 dark:text-brand-400'
                                    : isDone
                                    ? 'text-slate-900 dark:text-white'
                                    : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Security OTP Verification Box (When confirmed / in-progress) */}
                  {(currentBooking.status === 'confirmed' || currentBooking.status === 'in_progress') && (
                    <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
                      <div className="flex items-center gap-2 mb-3">
                        <KeyRound className="w-4 h-4 text-brand-500" />
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          Service Verification OTPs
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                        Share these OTPs only with your technician on-site to verify starting and finishing the service.
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-center">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Start Job OTP</span>
                          <p className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono tracking-widest mt-0.5">
                            {currentBooking.start_otp || '4821'}
                          </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-center">
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Complete Job OTP</span>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-widest mt-0.5">
                            {currentBooking.end_otp || '9273'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── RIGHT 1 COL: ASSIGNED PROVIDER & ORDER SUMMARY ── */}
                <div className="space-y-5">
                  {/* Assigned Provider Card */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Assigned Service Partner
                    </h3>

                    {currentBooking.provider?.full_name ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center text-xl font-bold">
                            👷
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {currentBooking.provider.full_name}
                              </h4>
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              KYC Verified Specialist
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
                          <span className="text-slate-400">Rating</span>
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {currentBooking.provider_details?.rating || '4.9'} ({currentBooking.provider_details?.total_jobs || '120+'} jobs)
                          </span>
                        </div>

                        {currentBooking.provider?.phone && (
                          <a
                            href={`tel:${currentBooking.provider.phone}`}
                            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5 text-brand-500" />
                            <span>Call Professional</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-sm animate-spin">
                          ⏳
                        </div>
                        <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                          Matching in progress
                        </p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400">
                          Admin is assigning a verified technician in {currentBooking.district}.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Summary & Price Breakdown */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-3 text-xs">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                      Booking Summary
                    </h3>

                    <div className="space-y-2 text-slate-600 dark:text-slate-400">
                      <div className="flex justify-between">
                        <span>Scheduled Slot</span>
                        <span className="font-semibold text-slate-900 dark:text-white text-right">
                          {currentBooking.scheduled_at || 'Scheduled'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Address</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px] text-right">
                          {currentBooking.address}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Base Amount</span>
                        <span>₹{currentBooking.base_amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee (5%)</span>
                        <span>₹{currentBooking.platform_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%)</span>
                        <span>₹{currentBooking.gst_amount}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-200 dark:border-navy-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                        <span>Total Paid / Payable</span>
                        <span className="text-brand-600 dark:text-brand-400 font-black">
                          ₹{currentBooking.total_amount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* UPI Payment Modal */}
      {currentBooking && (
        <UpiPaymentModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          booking={{
            id: currentBooking.id,
            booking_ref: currentBooking.booking_ref,
            customer_id: currentBooking.customer_id,
            provider_id: currentBooking.provider_id,
            total_amount: currentBooking.total_amount,
            base_amount: currentBooking.base_amount,
            platform_fee: currentBooking.platform_fee,
            gst_amount: currentBooking.gst_amount,
            category: currentBooking.category
          }}
          onSuccess={() => {
            loadBookings()
          }}
        />
      )}

      {/* Review Modal */}
      {currentBooking && currentBooking.provider_id && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          booking={{
            id: currentBooking.id,
            booking_ref: currentBooking.booking_ref,
            customer_id: currentBooking.customer_id,
            provider_id: currentBooking.provider_id,
            provider: currentBooking.provider,
            category: currentBooking.category
          }}
          onSubmitted={() => {
            loadBookings()
          }}
        />
      )}
    </div>
  )
}
