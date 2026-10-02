import React, { useEffect, useState } from 'react'
import {
  Users,
  Search,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getVerifiedProvidersList, updateProviderKycStatus } from '@/services/api'
import { ProviderProfile } from '@/types'
import { StatusBadge } from '@/components/ui/Badge'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function AdminProviders() {
  const [providers, setProviders] = useState<ProviderProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [kycFilter, setKycFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all')

  const fetchProviders = async () => {
    setLoading(true)
    const data = await getVerifiedProvidersList()
    setProviders(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProviders()
  }, [])

  async function handleVerify(providerId: string) {
    const res = await updateProviderKycStatus(providerId, 'verified')
    if (res.success) {
      toast.success('Provider marked as Verified!')
      fetchProviders()
    } else {
      toast.error(res.error || 'Failed to update')
    }
  }

  async function handleReject(providerId: string) {
    const res = await updateProviderKycStatus(providerId, 'rejected')
    if (res.success) {
      toast.success('Provider KYC rejected')
      fetchProviders()
    } else {
      toast.error(res.error || 'Failed to update')
    }
  }

  const filtered = providers.filter(p => {
    const matchesKyc = kycFilter === 'all' || p.kyc_status === kycFilter
    const matchesSearch =
      (p.profile?.full_name && p.profile.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.profile?.district && p.profile.district.toLowerCase().includes(search.toLowerCase())) ||
      (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase())) ||
      (p.bio && p.bio.toLowerCase().includes(search.toLowerCase()))
    return matchesKyc && matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Service Provider Directory" subtitle="Manage partner profiles, skills, and KYC status" showLocation={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Controls */}
        <div className="p-4 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search providers by name, trade, skills, or district..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-navy-800 p-1 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: 'All' },
                { id: 'verified', label: 'Verified' },
                { id: 'pending', label: 'Pending' },
                { id: 'rejected', label: 'Rejected' },
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setKycFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    kycFilter === t.id
                      ? 'bg-brand-500 text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={fetchProviders}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Providers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/3" />
                <div className="h-3 bg-slate-200 dark:bg-navy-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-subtle space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-xl">
              👷
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">No Providers Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No service partners matched your filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(prov => (
              <div
                key={prov.id}
                className="p-5 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center text-xl font-bold flex-shrink-0">
                      👷
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {prov.profile?.full_name || 'Verified Provider'}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          prov.kyc_status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}>
                          {prov.kyc_status === 'verified' ? 'KYC Verified' : 'KYC Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {prov.bio || 'General Technician'} • {prov.experience_years} Years Experience
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {prov.rating} ({prov.total_jobs} jobs)
                  </span>
                </div>

                {/* Details Bar */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 text-xs text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block">District</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {prov.profile?.district || 'Karnataka'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Phone</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {prov.profile?.phone || '+91 98450 00000'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Rate / Unit</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      ₹{prov.hourly_rate || 250}/hr
                    </span>
                  </div>
                </div>

                {/* Skills tags */}
                {prov.skills_tags && prov.skills_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {prov.skills_tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Admin Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-navy-800 flex items-center justify-end gap-2">
                  {prov.kyc_status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => handleVerify(prov.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve KYC</span>
                    </button>
                  )}
                  {prov.kyc_status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleReject(prov.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-bold text-xs border border-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
