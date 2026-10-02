import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ShieldCheck, Smartphone, QrCode, AlertCircle, ArrowRight, Loader2, X, Lock } from 'lucide-react'
import { verifyAndProcessUpiPayment } from '@/services/api'
import toast from 'react-hot-toast'

interface UpiPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    booking_ref: string
    customer_id: string
    provider_id?: string | null
    total_amount: number
    base_amount?: number
    platform_fee?: number
    gst_amount?: number
    category?: { name: string; icon?: string }
  }
  onSuccess: () => void
}

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: '⚡', color: '#1a73e8', bg: '#e8f0fe', vpaSuffix: '@okaxis' },
  { id: 'phonepe', name: 'PhonePe', icon: '🟣', color: '#5f259f', bg: '#f3e8ff', vpaSuffix: '@ybl' },
  { id: 'paytm', name: 'Paytm UPI', icon: '🔵', color: '#00b9f5', bg: '#e0f7fe', vpaSuffix: '@paytm' },
  { id: 'bhim', name: 'BHIM UPI', icon: '🇮🇳', color: '#00834e', bg: '#e6f4ea', vpaSuffix: '@upi' },
  { id: 'cred', name: 'CRED UPI', icon: '⚫', color: '#111827', bg: '#f3f4f6', vpaSuffix: '@cred' },
]

export default function UpiPaymentModal({ isOpen, onClose, booking, onSuccess }: UpiPaymentModalProps) {
  const [methodTab, setMethodTab] = useState<'apps' | 'id' | 'qr'>('apps')
  const [selectedApp, setSelectedApp] = useState('gpay')
  const [upiId, setUpiId] = useState('')
  const [payState, setPayState] = useState<'idle' | 'authorizing' | 'verifying' | 'success' | 'failed'>('idle')
  const [countdown, setCountdown] = useState(120)
  const [txnRef, setTxnRef] = useState('')

  const base = booking.base_amount || Math.round(booking.total_amount * 0.94)
  const fee = booking.platform_fee || Math.round(base * 0.05)
  const gst = booking.gst_amount || Math.round(fee * 0.18)
  const total = booking.total_amount || (base + fee + gst)

  useEffect(() => {
    if (!isOpen) {
      setPayState('idle')
      setUpiId('')
      setCountdown(120)
    }
  }, [isOpen])

  // Countdown timer for QR / Authorizing
  useEffect(() => {
    if (!isOpen || payState === 'success') return
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen, payState])

  async function handlePay() {
    let resolvedVpa = ''
    if (methodTab === 'apps') {
      const app = UPI_APPS.find(a => a.id === selectedApp)
      resolvedVpa = `user.${selectedApp}${app?.vpaSuffix || '@upi'}`
    } else if (methodTab === 'id') {
      if (!upiId.trim() || !upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID (e.g. mobile@upi or name@okaxis)')
        return
      }
      resolvedVpa = upiId.trim()
    } else {
      resolvedVpa = 'powerstar.qr@npci'
    }

    setPayState('authorizing')

    // Step 1: Simulated UPI Intent dispatch
    setTimeout(() => {
      setPayState('verifying')

      // Step 2: NPCI Verification & Database record creation
      setTimeout(async () => {
        try {
          const res = await verifyAndProcessUpiPayment({
            bookingId: booking.id,
            customerId: booking.customer_id,
            providerId: booking.provider_id,
            amount: total,
            upiVpa: resolvedVpa
          })

          if (res.success) {
            setTxnRef(res.transactionId || `UPI-${Date.now()}`)
            setPayState('success')
            toast.success('UPI Payment Verified & Confirmed! 🎉')
            setTimeout(() => {
              onSuccess()
              onClose()
            }, 2200)
          } else {
            setPayState('failed')
            toast.error(res.error || 'Payment could not be verified')
          }
        } catch (err: any) {
          setPayState('failed')
          toast.error(err?.message || 'Payment failed')
        }
      }, 1600)
    }, 1400)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-navy-700/80 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-navy-900 to-navy-800 text-white flex items-center justify-between border-b border-navy-700">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-sm">
                UPI
              </div>
              <div>
                <h3 className="font-bold text-base text-white">UPI Secure Checkout</h3>
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
          <div className="p-6 overflow-y-auto flex-1">
            {/* Price Banner */}
            <div className="bg-slate-50 dark:bg-navy-800/80 rounded-2xl p-4 border border-slate-200/70 dark:border-navy-700/60 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Payable Amount</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> UPI Only
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ₹{total.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {booking.category?.name || 'Powerstar Service'}
                </span>
              </div>

              {/* Price Breakdown toggle */}
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-navy-700 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Base Service Fee</span>
                  <span>₹{base}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Service Fee (5%)</span>
                  <span>₹{fee}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18% on Fee)</span>
                  <span>₹{gst}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT STATE: IDLE */}
            {payState === 'idle' && (
              <div>
                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-navy-800 rounded-xl mb-4 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMethodTab('apps')}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      methodTab === 'apps'
                        ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> UPI Apps
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethodTab('id')}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      methodTab === 'id'
                        ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" /> Enter UPI ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethodTab('qr')}
                    className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      methodTab === 'qr'
                        ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" /> Scan QR
                  </button>
                </div>

                {/* TAB 1: UPI APPS */}
                {methodTab === 'apps' && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Choose installed UPI application
                    </p>
                    {UPI_APPS.map(app => (
                      <label
                        key={app.id}
                        onClick={() => setSelectedApp(app.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedApp === app.id
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 shadow-sm'
                            : 'border-slate-200 dark:border-navy-700 hover:border-slate-300 dark:hover:border-navy-600 bg-white dark:bg-navy-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{app.icon}</span>
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{app.name}</p>
                            <p className="text-xs text-slate-400">Instant UPI Direct Debit</p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="upiApp"
                          checked={selectedApp === app.id}
                          onChange={() => setSelectedApp(app.id)}
                          className="w-4 h-4 text-brand-500 focus:ring-brand-500"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {/* TAB 2: UPI ID / VPA */}
                {methodTab === 'id' && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Enter UPI VPA (Virtual Payment Address)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9876543210@paytm or name@okhdfcbank"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {['@okhdfcbank', '@okaxis', '@ybl', '@paytm', '@upi'].map(suffix => (
                        <button
                          key={suffix}
                          type="button"
                          onClick={() => setUpiId(prev => (prev.split('@')[0] || 'yourname') + suffix)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                        >
                          {suffix}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      A payment request will be sent to your UPI app for authorization.
                    </p>
                  </div>
                )}

                {/* TAB 3: QR CODE */}
                {methodTab === 'qr' && (
                  <div className="text-center py-2 space-y-3 mb-4">
                    <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-brand-300 shadow-md">
                      {/* Stylized QR Code mock with NPCI badge */}
                      <div className="w-44 h-44 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-between text-white relative">
                        <div className="flex justify-between w-full p-1">
                          <div className="w-8 h-8 border-4 border-white bg-slate-900" />
                          <div className="w-8 h-8 border-4 border-white bg-slate-900" />
                        </div>
                        <div className="flex items-center justify-center flex-col">
                          <span className="text-2xl font-black text-brand-400">⚡ PS</span>
                          <span className="text-[9px] tracking-wider text-slate-300 font-mono">UPI-VERIFIED</span>
                        </div>
                        <div className="flex justify-between w-full p-1">
                          <div className="w-8 h-8 border-4 border-white bg-slate-900" />
                          <div className="w-6 h-6 bg-brand-500 rounded-sm" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
                      </p>
                      <p className="text-xs font-mono text-brand-600 dark:text-brand-400 font-semibold mt-1">
                        QR Expires in {formatTime(countdown)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Trust Footer */}
                <div className="flex items-center justify-center gap-4 py-2 border-t border-slate-100 dark:border-navy-800 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> 100% Secure NPCI UPI
                  </span>
                  <span>•</span>
                  <span>Direct Bank Settlement</span>
                </div>
              </div>
            )}

            {/* PAYMENT STATE: AUTHORIZING / VERIFYING */}
            {(payState === 'authorizing' || payState === 'verifying') && (
              <div className="py-12 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin flex items-center justify-center mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-brand-500">
                    UPI
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                    {payState === 'authorizing' ? 'Connecting to UPI Network…' : 'Verifying Payment with NPCI…'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Please do not refresh or press back while we confirm your transaction.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-navy-800 text-xs font-mono text-slate-600 dark:text-slate-300">
                  <Loader2 className="w-3 h-3 animate-spin text-brand-500" />
                  Awaiting bank callback…
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
                    Your booking is now <span className="font-semibold text-emerald-500">CONFIRMED</span>.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800 text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700 max-w-xs mx-auto">
                  <p className="text-slate-400 text-[10px]">TRANSACTION REFERENCE</p>
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
                    We could not verify the transaction. Please try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayState('idle')}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-colors"
                >
                  Retry UPI Payment
                </button>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {payState === 'idle' && (
            <div className="p-4 bg-slate-50 dark:bg-navy-800/60 border-t border-slate-200/80 dark:border-navy-700">
              <button
                type="button"
                onClick={handlePay}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-sm shadow-brand transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span>Pay ₹{total} via UPI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
