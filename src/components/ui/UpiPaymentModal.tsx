import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { verifyAndProcessUpiPayment } from '@/services/api'
import { initiateRazorpayCheckout } from '@/services/razorpay'

interface UpiPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    booking_ref: string
    customer_id: string
    provider_id?: string | null
    total_amount?: number
    base_amount?: number
    platform_fee?: number
    category?: {
      name: string
      icon?: string
    }
    customer?: {
      full_name?: string
      phone?: string
    }
  }
  onSuccess: () => void
}

export default function UpiPaymentModal({ isOpen, onClose, booking, onSuccess }: UpiPaymentModalProps) {
  const [payState, setPayState] = useState<'idle' | 'authorizing' | 'success' | 'failed'>('idle')
  const [txnRef, setTxnRef] = useState('')

  // Fixed nominal booking / token fee: strictly ₹11
  const total = 11

  useEffect(() => {
    if (!isOpen) {
      setPayState('idle')
      setTxnRef('')
    }
  }, [isOpen])

  async function handleRazorpayCheckout() {
    setPayState('authorizing')
    await initiateRazorpayCheckout({
      amount: total,
      bookingId: booking.id,
      bookingRef: booking.booking_ref,
      customerName: booking.customer?.full_name,
      customerPhone: booking.customer?.phone,
      description: `Powerstar ${booking.category?.name || 'Service'} Booking #${booking.booking_ref}`,
      onSuccess: async (result) => {
        setTxnRef(result.paymentId)
        setPayState('success')
        await verifyAndProcessUpiPayment({
          bookingId: booking.id,
          customerId: booking.customer_id,
          providerId: booking.provider_id,
          amount: total,
          upiVpa: `rzp:${result.paymentId}`
        })
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1800)
      },
      onError: (err) => {
        setPayState('idle')
      },
      onDismiss: () => {
        setPayState('idle')
      }
    })
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-md bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-navy-700/80 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white flex items-center justify-between border-b border-navy-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold text-sm">
                <CreditCard className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Razorpay Secure Checkout</h3>
                <p className="text-xs text-slate-300">Booking Ref: #{booking.booking_ref}</p>
              </div>
            </div>
            {payState === 'idle' && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {/* Price Banner */}
            <div className="bg-slate-50 dark:bg-navy-800/80 rounded-2xl p-4 border border-slate-200/70 dark:border-navy-700/60">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Online Advance Booking Fee
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Nominal Fee
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  ₹{total}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {booking.category?.name || 'Service Visit Confirmation'}
                </span>
              </div>

              {/* Explanation Note */}
              <div className="mt-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Pay only ₹{total} now</strong> to confirm the technician's visit. Actual labor & material costs will be inspected on-site by the technician upon arrival.
                </span>
              </div>
            </div>

            {/* PAYMENT STATE: IDLE */}
            {payState === 'idle' && (
              <div className="space-y-4">
                {/* Razorpay Showcase Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50 to-orange-50/40 dark:from-navy-800 dark:to-navy-800/60 border border-brand-200/80 dark:border-navy-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Razorpay Standard Gateway
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Live Verified
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Pay ₹{total} seamlessly using your preferred payment option in Razorpay:
                  </p>

                  {/* Payment Method Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                      <span>📱</span>
                      <span>UPI & QR</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                      <span>⚡</span>
                      <span>GPay / PhonePe</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                      <span>💳</span>
                      <span>Debit & Credit Cards</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                      <span>🏦</span>
                      <span>NetBanking</span>
                    </div>
                  </div>

                  {/* Trust Footer */}
                  <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>100% RBI Authorized & Encrypted</span>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT STATE: AUTHORIZING */}
            {payState === 'authorizing' && (
              <div className="py-12 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin flex items-center justify-center mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-brand-500">
                    <CreditCard className="w-7 h-7 text-brand-500" />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                    Opening Razorpay Gateway…
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Please complete the ₹{total} payment in the Razorpay checkout window.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-navy-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
                  Awaiting Razorpay confirmation…
                </div>
              </div>
            )}

            {/* PAYMENT STATE: SUCCESS */}
            {payState === 'success' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-bold text-xl text-slate-900 dark:text-white">
                    ₹{total} Paid Successfully!
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your technician visit is now <span className="font-semibold text-emerald-500">CONFIRMED</span>.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800 text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 max-w-xs mx-auto">
                  <p className="text-slate-400 text-[10px]">PAYMENT ID</p>
                  <p className="font-bold mt-0.5">{txnRef}</p>
                </div>
              </div>
            )}

            {/* PAYMENT STATE: FAILED */}
            {payState === 'failed' && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                    Payment Verification Failed
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    The payment was cancelled or declined. Please try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayState('idle')}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-colors"
                >
                  Retry Razorpay Payment
                </button>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {payState === 'idle' && (
            <div className="p-4 bg-slate-50 dark:bg-navy-800/60 border-t border-slate-200/80 dark:border-navy-700">
              <button
                type="button"
                onClick={handleRazorpayCheckout}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-sm shadow-brand transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay ₹{total} via Razorpay Gateway</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
