import React, { useState } from 'react'
import { Activity, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

const DISPUTES = [
  {
    ref: 'PS-28400',
    title: 'Customer Resolution — Incomplete Work',
    desc: 'Customer reported technician left before testing kitchen sink fitting. Partial refund or free revisit requested.',
    customer: 'Kavitha Murthy',
    provider: 'Suresh Kumar',
    amount: 1200,
    date: 'Recent'
  },
  {
    ref: 'PS-28350',
    title: 'Provider Dispatch Reassignment',
    desc: 'Original provider vehicle broke down en route. Admin reassigned backup vehicle within 20 mins.',
    customer: 'Priya Sharma',
    provider: 'Ganesh B.',
    amount: 480,
    date: 'Yesterday'
  }
]

export default function AdminDisputes() {
  const [resolvedRefs, setResolvedRefs] = useState<string[]>([])

  function handleAction(ref: string, msg: string) {
    setResolvedRefs(prev => [...prev, ref])
    toast.success(msg)
  }

  const openDisputes = DISPUTES.filter(d => !resolvedRefs.includes(d.ref))
  const resolvedDisputes = DISPUTES.filter(d => resolvedRefs.includes(d.ref))

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Disputes & Customer Support" subtitle="Resolve customer escalations, rework requests & UPI refunds" showLocation={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{openDisputes.length} Open Escalations • {resolvedDisputes.length} Resolved</span>
        </div>

        {openDisputes.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-subtle space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">All Disputes Cleared!</h3>
            <p className="text-xs text-slate-400">No active customer tickets or escalations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {openDisputes.map(d => (
              <div
                key={d.ref}
                className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold block">
                      Booking #{d.ref} • {d.date}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {d.title}
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-600 text-[10px] font-bold border border-red-500/20">
                    Open Ticket
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {d.desc}
                </p>

                <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-navy-800/60 border border-slate-200/60 dark:border-navy-700/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Customer</span>
                    <span className="font-bold text-slate-900 dark:text-white">{d.customer}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Provider</span>
                    <span className="font-bold text-slate-900 dark:text-white">{d.provider}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Amount</span>
                    <span className="font-black text-brand-600 dark:text-brand-400">₹{d.amount}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-navy-800">
                  <button
                    type="button"
                    onClick={() => handleAction(d.ref, `UPI Refund of ₹${d.amount} approved for ${d.customer}`)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Issue UPI Refund (₹{d.amount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(d.ref, `Free technician revisit scheduled for ${d.customer}`)}
                    className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-colors"
                  >
                    Schedule Free Revisit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(d.ref, `Ticket #${d.ref} closed without refund`)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                  >
                    Dismiss Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
