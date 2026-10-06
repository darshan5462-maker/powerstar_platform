import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Calendar,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Zap,
  ArrowRight,
  Activity,
  MapPin,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getAllBookingsAdmin, getVerifiedProvidersList } from '@/services/api'
import { Booking, ProviderProfile } from '@/types'
import { StatusBadge } from '@/components/ui/Badge'
import HeaderBar from '@/components/layout/HeaderBar'

export default function AdminHome() {
  const nav = useNavigate()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const [bData, pData] = await Promise.all([
        getAllBookingsAdmin(),
        getVerifiedProvidersList()
      ])
      setBookings(bData)
      setProviders(pData)
      setLoading(false)
    }
    fetchData()
    const interval = setInterval(fetchData, 30000)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ps_bookings_sync_v2') fetchData()
    }
    window.addEventListener('storage', handleStorage)

    const channel = supabase
      .channel('admin-home-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
      supabase.removeChannel(channel)
    }
  }, [])

  const pendingAssignment = bookings.filter(b => {
    const s = (b.status || '').toLowerCase()
    return (['pending_admin', 'pending', 'requested', 'unassigned'].includes(s) || !b.provider_id) && !['cancelled', 'rejected', 'completed', 'in_progress', 'confirmed', 'payment_pending', 'provider_assigned'].includes(s)
  })
  const providerAssigned = bookings.filter(b => ['provider_assigned', 'accepted'].includes((b.status || '').toLowerCase()))
  const paymentPending = bookings.filter(b => ['payment_pending', 'payment_due'].includes((b.status || '').toLowerCase()))
  const confirmed = bookings.filter(b => ['confirmed', 'in_progress', 'active', 'payment_success'].includes((b.status || '').toLowerCase()))
  const completed = bookings.filter(b => ['completed', 'settled', 'done'].includes((b.status || '').toLowerCase()))

  const totalRevenue = completed.reduce((acc, b) => acc + (b.total_amount || 0), 0)
  const totalPlatformFees = completed.reduce((acc, b) => acc + (b.platform_fee || Math.round((b.total_amount || 0) * 0.05)), 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Admin Command Center" subtitle="Real-time dispatch, booking assignment & platform metrics" showLocation={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* ── 1. ALERT BANNER: UNASSIGNED BOOKINGS ── */}
        {pendingAssignment.length > 0 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-brand flex-shrink-0 animate-pulse">
                ⚡
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{pendingAssignment.length} Booking{pendingAssignment.length > 1 ? 's' : ''} Awaiting Provider Assignment</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white uppercase">
                    Action Required
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Customers are waiting for technician dispatch in {pendingAssignment.map(b => b.district).slice(0, 3).join(', ')}.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => nav('/admin/bookings?filter=pending_admin')}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-brand flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <span>Assign Providers Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── 2. METRICS STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Total Bookings</span>
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {bookings.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Across 31 Districts</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-amber-500/40 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Pending Assignment</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                ⏳
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {pendingAssignment.length}
            </p>
            <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1">Needs admin match</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Active / In-Progress</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {confirmed.length + providerAssigned.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Assigned & active</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">Gross Volume (UPI)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Platform Fee: ₹{totalPlatformFees}</p>
          </div>
        </div>

        {/* ── 3. QUICK ASSIGNMENT WORKFLOW QUEUE ── */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Dispatch Queue ({pendingAssignment.length} Unassigned)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Admin controls technician selection for all customer requests
              </p>
            </div>

            <button
              type="button"
              onClick={() => nav('/admin/bookings')}
              className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pendingAssignment.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-navy-800/50 rounded-2xl border border-slate-200 dark:border-navy-700/60 text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-slate-900 dark:text-white">All Bookings Assigned!</p>
              <p className="text-slate-400 mt-0.5">No pending customer requests right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAssignment.slice(0, 3).map(bk => (
                <div
                  key={bk.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-xl flex-shrink-0">
                      {bk.category?.icon || '⚡'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {bk.category?.name || 'Service'}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-400">#{bk.booking_ref}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Customer: {bk.customer?.full_name || 'Customer'} • 📍 {bk.district} ({bk.city})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="font-extrabold text-xs text-brand-600 dark:text-brand-400">
                      ₹{bk.total_amount}
                    </span>
                    <button
                      type="button"
                      onClick={() => nav(`/admin/bookings?assign=${bk.id}`)}
                      className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand flex items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Assign Provider</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. RECENT ACTIVITY LOG ── */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Recent Platform Bookings
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">District</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {bookings.slice(0, 6).map(bk => (
                  <tr key={bk.id} className="hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900 dark:text-white">#{bk.booking_ref}</td>
                    <td className="py-3 font-medium text-slate-700 dark:text-slate-300">{bk.customer?.full_name || 'Customer'}</td>
                    <td className="py-3 text-slate-800 dark:text-slate-200">{bk.category?.name || 'Service'}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{bk.district}</td>
                    <td className="py-3 font-bold text-brand-600 dark:text-brand-400">₹{bk.total_amount}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">
                      {bk.provider?.full_name ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{bk.provider.full_name}</span>
                      ) : (
                        <span className="text-amber-500 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={bk.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
