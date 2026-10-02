import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getProviderAssignedJobs } from '@/services/api'
import { Booking } from '@/types'
import HeaderBar from '@/components/layout/HeaderBar'

export default function ProviderEarnings() {
  const { profile } = useAuthStore()
  const [jobs, setJobs] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const fetch = async () => {
      setLoading(true)
      const data = await getProviderAssignedJobs(profile.id)
      setJobs(data)
      setLoading(false)
    }
    fetch()
  }, [profile?.id])

  const completedJobs = jobs.filter(j => j.status === 'completed')
  const totalPayout = completedJobs.reduce((acc, j) => acc + Math.round((j.total_amount || 0) * 0.90), 0)
  const pendingPayout = jobs
    .filter(j => ['confirmed', 'in_progress'].includes(j.status))
    .reduce((acc, j) => acc + Math.round((j.total_amount || 0) * 0.90), 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Earnings & Settlement Ledger" subtitle="90% direct payout per completed service job" showLocation={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Earnings Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 text-white border border-navy-700 shadow-xl space-y-6">
          <div>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Total Settled Earnings
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-display">
                ₹{totalPayout.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-400">via Instant UPI Settlement</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-navy-700/80 text-xs">
            <div>
              <span className="text-slate-400 block">Pending Clearance</span>
              <span className="font-extrabold text-amber-400 text-sm mt-0.5 block">
                ₹{pendingPayout.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Completed Jobs</span>
              <span className="font-extrabold text-white text-sm mt-0.5 block">
                {completedJobs.length} Jobs
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block">Payout Share</span>
              <span className="font-extrabold text-brand-400 text-sm mt-0.5 block">
                90% of Total Amount
              </span>
            </div>
          </div>
        </div>

        {/* Payout History Ledger */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Payout Breakdown by Service
          </h3>

          {completedJobs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-navy-800 rounded-2xl text-xs text-slate-400">
              No completed jobs yet. Once you complete a job with customer End OTP, your 90% payout appears here.
            </div>
          ) : (
            <div className="space-y-3">
              {completedJobs.map(job => {
                const payout = Math.round(job.total_amount * 0.90)
                const platformFee = Math.round(job.total_amount * 0.10)
                return (
                  <div
                    key={job.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg flex-shrink-0">
                        {job.category?.icon || '⚡'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {job.category?.name || 'Service Job'}
                          </h4>
                          <span className="font-mono text-[10px] text-slate-400 font-semibold">
                            #{job.booking_ref}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Customer: {job.customer?.full_name || 'Customer'} • {job.district}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm block">
                        +₹{payout}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Paid via UPI
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
