import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase,
  DollarSign,
  Star,
  ShieldCheck,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  KeyRound,
  Zap,
  ArrowRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { getProviderAssignedJobs, startServiceJob, completeServiceJob } from '@/services/api'
import { Booking } from '@/types'
import { StatusBadge } from '@/components/ui/Badge'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function ProviderHome() {
  const { profile } = useAuthStore()
  const [jobs, setJobs] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'in_progress' | 'completed'>('all')

  // OTP Modal State
  const [otpModalJob, setOtpModalJob] = useState<{ job: Booking; type: 'start' | 'complete' } | null>(null)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Availability toggle
  const [isOnline, setIsOnline] = useState(true)

  const fetchJobs = useCallback(async () => {
    if (!profile?.id) return
    setLoading(true)
    const data = await getProviderAssignedJobs(profile.id)
    setJobs(data)
    setLoading(false)
  }, [profile?.id])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Realtime updates for provider
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel(`prov-jobs-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${profile.id}`
        },
        () => {
          fetchJobs()
          toast.success('⚡ Jobs queue updated in real-time!')
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, fetchJobs])

  async function handleConfirmOtp() {
    if (!otpModalJob) return
    if (enteredOtp.length !== 4) {
      toast.error('Please enter the 4-digit OTP provided by customer')
      return
    }

    setActionLoading(true)
    try {
      if (otpModalJob.type === 'start') {
        const res = await startServiceJob(otpModalJob.job.id, profile!.id, enteredOtp)
        if (res.success) {
          toast.success('Service started! Work in progress.')
          setOtpModalJob(null)
          setEnteredOtp('')
          fetchJobs()
        } else {
          toast.error(res.error || 'Invalid Start OTP')
        }
      } else {
        const res = await completeServiceJob(otpModalJob.job.id, profile!.id, enteredOtp)
        if (res.success) {
          toast.success('Service marked Completed! Earnings credited.')
          setOtpModalJob(null)
          setEnteredOtp('')
          fetchJobs()
        } else {
          toast.error(res.error || 'Invalid End OTP')
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed')
    } finally {
      setActionLoading(false)
    }
  }

  const assignedJobs = jobs.filter(j => ['provider_assigned', 'payment_pending', 'confirmed'].includes(j.status))
  const inProgressJobs = jobs.filter(j => j.status === 'in_progress')
  const completedJobs = jobs.filter(j => j.status === 'completed')

  const totalEarnings = completedJobs.reduce((acc, j) => acc + Math.round((j.total_amount || 0) * 0.9), 0)

  const filtered = jobs.filter(j => {
    if (activeTab === 'assigned') return ['provider_assigned', 'payment_pending', 'confirmed'].includes(j.status)
    if (activeTab === 'in_progress') return j.status === 'in_progress'
    if (activeTab === 'completed') return j.status === 'completed'
    return true
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Partner Job Terminal" subtitle="Assigned jobs & customer dispatch" showLocation={false} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Top Partner Header Banner with Online Switch */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-navy-900 to-navy-800 text-white border border-navy-700 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 text-brand-400 flex items-center justify-center font-extrabold text-2xl">
              👷
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-white">
                {profile?.full_name || 'Powerstar Partner'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>{profile?.district || 'Karnataka'} • Certified Partner</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
              <span className={`text-xs font-bold ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                {isOnline ? '● Online & Ready' : '○ Offline'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOnline(!isOnline)
                toast.success(isOnline ? 'Switched to Offline' : 'Switched to Online! Ready for new jobs.')
              }}
              className={`w-14 h-7 rounded-full transition-colors p-0.5 flex items-center ${
                isOnline ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-white shadow-md" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-subtle">
            <span className="text-xs text-slate-400 font-semibold block">Total Earnings</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹{totalEarnings.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-subtle">
            <span className="text-xs text-slate-400 font-semibold block">Active Assigned</span>
            <p className="text-2xl font-black text-brand-500 mt-1">
              {assignedJobs.length}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-subtle">
            <span className="text-xs text-slate-400 font-semibold block">In Progress</span>
            <p className="text-2xl font-black text-blue-500 mt-1">
              {inProgressJobs.length}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-subtle">
            <span className="text-xs text-slate-400 font-semibold block">Completed Jobs</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {completedJobs.length}
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: `All Jobs (${jobs.length})` },
            { id: 'assigned', label: `Assigned / Upcoming (${assignedJobs.length})` },
            { id: 'in_progress', label: `In Progress (${inProgressJobs.length})` },
            { id: 'completed', label: `Completed (${completedJobs.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-brand-500 text-white shadow-brand font-bold'
                  : 'bg-white dark:bg-navy-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-navy-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-subtle space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No Assigned Jobs</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any jobs in this category right now. Stay online to receive admin dispatches!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(job => {
              const isPaymentPending = job.status === 'provider_assigned' || job.status === 'payment_pending'
              const isConfirmed = job.status === 'confirmed'
              const isInProgress = job.status === 'in_progress'
              const isCompleted = job.status === 'completed'
              const providerPayout = Math.round(job.total_amount * 0.9)

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-navy-800 text-brand-500 flex items-center justify-center text-2xl flex-shrink-0">
                        {job.category?.icon || '⚡'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {job.category?.name || 'Service Job'}
                          </h4>
                          <span className="font-mono text-xs text-slate-400 font-bold">
                            #{job.booking_ref}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Customer: <strong>{job.customer?.full_name || 'Customer'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={job.status} />
                      <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 ml-2">
                        +₹{providerPayout} Payout
                      </span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Schedule Slot</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{job.scheduled_at || 'Immediate'}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer Address</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5">{job.address}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Location</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{job.district} ({job.city})</p>
                    </div>
                  </div>

                  {/* Customer Notes if any */}
                  {job.customer_notes && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                      <strong>Customer Notes:</strong> {job.customer_notes}
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {job.customer?.phone ? (
                      <a
                        href={`tel:${job.customer.phone}`}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-brand-500" />
                        <span>Call Customer ({job.customer.phone})</span>
                      </a>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      {isPaymentPending && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          Awaiting Customer UPI Payment
                        </span>
                      )}

                      {/* START SERVICE CTA */}
                      {isConfirmed && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpModalJob({ job, type: 'start' })
                            setEnteredOtp('')
                          }}
                          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Start Job (Enter Start OTP)</span>
                        </button>
                      )}

                      {/* COMPLETE SERVICE CTA */}
                      {isInProgress && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpModalJob({ job, type: 'complete' })
                            setEnteredOtp('')
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete Job (Enter End OTP)</span>
                        </button>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Completed & Settled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ════════ START / COMPLETE JOB OTP MODAL ════════ */}
      {otpModalJob && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-navy-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-navy-700 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-xl font-bold">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {otpModalJob.type === 'start' ? 'Verify Start Service OTP' : 'Verify End Service OTP'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ask the customer for their 4-digit {otpModalJob.type === 'start' ? 'Start' : 'Complete'} OTP shown on their screen.
              </p>
            </div>

            <input
              type="text"
              maxLength={4}
              value={enteredOtp}
              onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="4-digit OTP"
              className="w-full py-3 text-center tracking-widest font-mono text-2xl font-black rounded-2xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOtpModalJob(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading || enteredOtp.length !== 4}
                onClick={handleConfirmOtp}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand disabled:opacity-50"
              >
                {actionLoading ? 'Verifying…' : 'Verify OTP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
