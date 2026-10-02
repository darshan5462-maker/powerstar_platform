import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Users,
  ShieldCheck,
  Star,
  Phone,
  MapPin,
  Calendar,
  Zap,
  CheckCircle2,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react'
import { getAllBookingsAdmin, getVerifiedProvidersList, assignProviderToBooking } from '@/services/api'
import { Booking, ProviderProfile } from '@/types'
import { StatusBadge } from '@/components/ui/Badge'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function AdminBookings() {
  const [searchParams] = useSearchParams()
  const initialFilterParam = searchParams.get('filter') || 'All'
  const autoAssignBookingId = searchParams.get('assign')

  const [filter, setFilter] = useState(initialFilterParam)
  const [search, setSearch] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  // Assignment Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState<Booking | null>(null)
  const [availableProviders, setAvailableProviders] = useState<ProviderProfile[]>([])
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [assigningProviderId, setAssigningProviderId] = useState<string | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    const data = await getAllBookingsAdmin()
    setBookings(data)
    setLoading(false)

    // If autoAssign query param passed from home banner, open assignment modal
    if (autoAssignBookingId) {
      const match = data.find(b => b.id === autoAssignBookingId)
      if (match) {
        handleOpenAssignModal(match)
      }
    }
  }

  useEffect(() => {
    fetchBookings()
    const interval = setInterval(fetchBookings, 3000)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ps_bookings_sync_v2') fetchBookings()
    }
    window.addEventListener('storage', handleStorage)

    const channel = supabase
      .channel('admin-bookings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchBookings()
      })
      .subscribe()

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorage)
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleOpenAssignModal(booking: Booking) {
    setSelectedBookingForAssign(booking)
    setAssignModalOpen(true)
    setLoadingProviders(true)
    try {
      const provs = await getVerifiedProvidersList(booking.district)
      setAvailableProviders(provs)
    } catch (err: any) {
      toast.error('Error fetching providers: ' + err.message)
    } finally {
      setLoadingProviders(false)
    }
  }

  async function handleConfirmAssign(providerId: string) {
    if (!selectedBookingForAssign) return
    setAssigningProviderId(providerId)
    try {
      const res = await assignProviderToBooking(selectedBookingForAssign.id, providerId)
      if (res.success) {
        toast.success(`Provider assigned to Booking #${selectedBookingForAssign.booking_ref}!`)
        setAssignModalOpen(false)
        setSelectedBookingForAssign(null)
        fetchBookings()
      } else {
        toast.error(res.error || 'Assignment failed')
      }
    } catch (err: any) {
      toast.error(err?.message || 'Assignment failed')
    } finally {
      setAssigningProviderId(null)
    }
  }

  const TABS = [
    { label: 'All', value: 'All' },
    { label: 'Pending Assignment', value: 'pending_admin' },
    { label: 'Provider Assigned', value: 'provider_assigned' },
    { label: 'Payment Pending', value: 'payment_pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const filteredBookings = bookings.filter(b => {
    const matchesFilter = filter === 'All' || b.status === filter
    const matchesSearch =
      b.booking_ref.toLowerCase().includes(search.toLowerCase()) ||
      (b.customer?.full_name && b.customer.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (b.category?.name && b.category.name.toLowerCase().includes(search.toLowerCase())) ||
      b.district.toLowerCase().includes(search.toLowerCase()) ||
      (b.provider?.full_name && b.provider.full_name.toLowerCase().includes(search.toLowerCase()))

    return matchesFilter && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Admin Booking Dispatch" subtitle="Review incoming requests, assign providers & manage statuses" showLocation={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Controls: Search & Tabs */}
        <div className="p-4 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by booking ref, customer name, district, service or provider..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <button
              type="button"
              onClick={fetchBookings}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {TABS.map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filter === tab.value
                    ? 'bg-brand-500 text-white shadow-brand font-bold'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table / Grid */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/4" />
                <div className="h-3 bg-slate-200 dark:bg-navy-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-subtle space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No Bookings Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No service requests match the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map(bk => {
              const needsAssignment = bk.status === 'pending_admin'
              return (
                <div
                  key={bk.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-navy-900 border shadow-card transition-all space-y-3 ${
                    needsAssignment
                      ? 'border-amber-500/60 ring-1 ring-amber-500/20 bg-amber-50/10'
                      : 'border-slate-200/80 dark:border-navy-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-800 text-brand-500 flex items-center justify-center text-xl flex-shrink-0">
                        {bk.category?.icon || '⚡'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {bk.category?.name || 'Service'}
                          </h4>
                          <span className="font-mono text-xs font-extrabold text-slate-500 dark:text-slate-400">
                            #{bk.booking_ref}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Customer: <strong>{bk.customer?.full_name || 'Customer'}</strong> ({bk.customer?.phone || 'No phone'})
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <StatusBadge status={bk.status} />
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white ml-2">
                        ₹{bk.total_amount}
                      </span>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">District & City</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{bk.district} ({bk.city})</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Scheduled At</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{bk.scheduled_at || 'Immediate'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Provider</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {bk.provider?.full_name ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {bk.provider.full_name}
                          </span>
                        ) : (
                          <span className="text-amber-500">Unassigned</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Street Address</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{bk.address}</span>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {bk.customer_notes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-800 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-navy-700">
                      <strong>Notes:</strong> {bk.customer_notes}
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="pt-2 flex items-center justify-end gap-2">
                    {needsAssignment ? (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(bk)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-brand flex items-center gap-1.5 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Assign Provider</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenAssignModal(bk)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reassign Provider</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ════════ ADMIN PROVIDER ASSIGNMENT MODAL ════════ */}
      {assignModalOpen && selectedBookingForAssign && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-2xl bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-navy-700 max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between bg-slate-50 dark:bg-navy-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-brand">
                    👷
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      Assign Service Provider
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Booking #{selectedBookingForAssign.booking_ref} • {selectedBookingForAssign.category?.name} • 📍 {selectedBookingForAssign.district}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setAssignModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 dark:bg-navy-700 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Providers List */}
              <div className="p-5 overflow-y-auto flex-1 space-y-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Verified Service Professionals available in {selectedBookingForAssign.district}:
                </p>

                {loadingProviders ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">Loading verified providers…</p>
                  </div>
                ) : availableProviders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-navy-800 rounded-2xl text-xs text-slate-500 space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="font-bold text-slate-900 dark:text-white">No Providers in this District</p>
                    <p className="text-slate-400">Add or verify service providers in {selectedBookingForAssign.district}.</p>
                  </div>
                ) : (
                  availableProviders.map(prov => (
                    <div
                      key={prov.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-navy-700 hover:border-brand-500 bg-white dark:bg-navy-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center text-xl font-bold flex-shrink-0">
                          👷
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                              {prov.profile?.full_name || 'Verified Provider'}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              KYC Verified
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {prov.bio || 'Specialized technician'} • {prov.experience_years} yrs exp
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              {prov.rating} ({prov.total_jobs} jobs)
                            </span>
                            <span>•</span>
                            <span>📍 {prov.profile?.district || 'Karnataka'}</span>
                            <span>•</span>
                            <span className="font-mono">{prov.profile?.phone || '+91 98450 00000'}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={assigningProviderId === prov.id}
                        onClick={() => handleConfirmAssign(prov.id)}
                        className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 flex-shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>{assigningProviderId === prov.id ? 'Assigning…' : 'Assign Provider'}</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
