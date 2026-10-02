import React, { useState } from 'react'
import { Search, Grid, Plus, Edit2, ShieldCheck, Tag } from 'lucide-react'
import { ALL_SERVICES, PROVIDER_COUNTS } from '@/data/services'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function AdminServices() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = ALL_SERVICES.filter(s =>
    (typeFilter === 'all' || s.type === typeFilter) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.nameKn && s.nameKn.includes(search)))
  )

  const counts = ALL_SERVICES.reduce((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Service Categories & Rates" subtitle="Manage 42 platform services, baseline pricing & units" showLocation={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'manpower', icon: '👷', label: 'Manpower', count: counts['manpower'] || 20, color: 'text-brand-500' },
            { id: 'vehicle', icon: '🚛', label: 'Vehicles', count: counts['vehicle'] || 13, color: 'text-blue-500' },
            { id: 'rto', icon: '📋', label: 'RTO & Legal', count: counts['rto'] || 5, color: 'text-emerald-500' },
            { id: 'financial', icon: '💰', label: 'Financial', count: counts['financial'] || 4, color: 'text-amber-500' },
          ].map(item => (
            <div
              key={item.id}
              onClick={() => setTypeFilter(typeFilter === item.id ? 'all' : item.id)}
              className={`p-4 rounded-2xl bg-white dark:bg-navy-900 border cursor-pointer transition-all ${
                typeFilter === item.id
                  ? 'border-brand-500 shadow-sm'
                  : 'border-slate-200/80 dark:border-navy-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <span className="text-xs text-slate-400 font-semibold">{item.label}</span>
                  <p className={`text-xl font-black font-display ${item.color}`}>
                    {item.count} Services
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Tabs */}
        <div className="p-4 bg-white dark:bg-navy-900 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search service by name or Kannada keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-navy-800 p-1 rounded-xl text-xs font-semibold overflow-x-auto no-scrollbar">
            {['all', 'manpower', 'vehicle', 'rto', 'financial'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all uppercase text-[11px] ${
                  typeFilter === t
                    ? 'bg-brand-500 text-white shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Services Table */}
        <div className="bg-white dark:bg-navy-900 rounded-3xl border border-slate-200/80 dark:border-navy-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/50 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="p-4">Service</th>
                  <th className="p-4">Kannada (ಕನ್ನಡ)</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">Active Pros</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{s.icon}</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{s.desc}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                      {s.nameKn || '—'}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-navy-800 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {s.type}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-brand-600 dark:text-brand-400">
                      ₹{s.basePrice}{s.unit}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {PROVIDER_COUNTS[s.id] || 45}+ Pros
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                        Active
                      </span>
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
