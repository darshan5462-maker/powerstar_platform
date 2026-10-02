import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Phone,
  MapPin,
  RefreshCw,
  ExternalLink,
  X,
  AlertCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { updateProviderKycStatus } from '@/services/api'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function AdminKyc() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inspectingDoc, setInspectingDoc] = useState<{ title: string; url: string } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('providers')
        .select(`
          *,
          profile:profiles(full_name, phone, district, city)
        `)
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        // Fallback demo KYC submissions
        setProviders([
          {
            id: 'prov-mock-1',
            kyc_status: 'submitted',
            experience_years: 6,
            aadhaar_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            selfie_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
            certificate_url: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=600&auto=format&fit=crop&q=80',
            bank_account_no: '918237461928',
            bank_ifsc: 'SBIN0004521',
            profile: {
              full_name: 'Basavaraj Patil',
              phone: '+91 98450 12345',
              district: 'Bengaluru Urban',
              city: 'Koramangala'
            }
          },
          {
            id: 'prov-mock-2',
            kyc_status: 'submitted',
            experience_years: 8,
            aadhaar_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            selfie_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
            bank_account_no: '876543219876',
            bank_ifsc: 'HDFC0001290',
            profile: {
              full_name: 'Manjunath Gowda',
              phone: '+91 94480 67890',
              district: 'Bengaluru Urban',
              city: 'Indiranagar'
            }
          }
        ])
      } else {
        setProviders(data)
      }
    } catch (err) {
      console.warn(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleApprove(providerId: string) {
    setProcessingId(providerId)
    const res = await updateProviderKycStatus(providerId, 'verified')
    if (res.success) {
      toast.success('KYC Documents Verified & Approved! 🚀')
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, kyc_status: 'verified' } : p))
    } else {
      toast.error(res.error || 'Failed to update')
    }
    setProcessingId(null)
  }

  async function handleReject(providerId: string) {
    setProcessingId(providerId)
    const res = await updateProviderKycStatus(providerId, 'rejected')
    if (res.success) {
      toast.success('KYC submission marked as Rejected.')
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, kyc_status: 'rejected' } : p))
    } else {
      toast.error(res.error || 'Failed to update')
    }
    setProcessingId(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="KYC Document Desk" subtitle="Review Aadhaar, selfies & trade certificates" showLocation={false} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Review partner identity documents to maintain a 100% verified service marketplace.
          </p>
          <button
            type="button"
            onClick={load}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-navy-700 rounded w-1/4" />
                <div className="h-3 bg-slate-200 dark:bg-navy-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : providers.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-navy-900 rounded-3xl border border-slate-200 dark:border-navy-800 shadow-subtle space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">KYC Desk is Clean</h3>
            <p className="text-xs text-slate-400">All provider document submissions have been verified.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map(p => (
              <div
                key={p.id}
                className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center text-xl font-bold flex-shrink-0">
                      👷
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {p.profile?.full_name || 'Provider'}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.kyc_status === 'verified'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : p.kyc_status === 'rejected'
                            ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {p.kyc_status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        📍 {p.profile?.district || 'Karnataka'} ({p.profile?.city || 'City'}) • Phone: {p.profile?.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.kyc_status !== 'verified' && (
                      <button
                        type="button"
                        disabled={processingId === p.id}
                        onClick={() => handleApprove(p.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve KYC</span>
                      </button>
                    )}
                    {p.kyc_status !== 'rejected' && (
                      <button
                        type="button"
                        disabled={processingId === p.id}
                        onClick={() => handleReject(p.id)}
                        className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-xs border border-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* Document Preview Thumbnails */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'Aadhaar Card', url: p.aadhaar_url, icon: '🪪' },
                    { title: 'Selfie Photo', url: p.selfie_url, icon: '📸' },
                    { title: 'Trade Certificate', url: p.certificate_url, icon: '📜' },
                    { title: 'Bank Passbook / IFSC', url: p.bank_passbook_url, icon: '🏦' },
                  ].map((doc, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                          <span>{doc.icon}</span> {doc.title}
                        </span>
                        {doc.url && (
                          <button
                            type="button"
                            onClick={() => setInspectingDoc({ title: doc.title, url: doc.url })}
                            className="text-brand-500 hover:text-brand-600"
                            title="Inspect full document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {doc.url ? (
                        <div
                          onClick={() => setInspectingDoc({ title: doc.title, url: doc.url })}
                          className="h-20 w-full rounded-xl bg-slate-200 dark:bg-navy-700 overflow-hidden cursor-pointer relative group"
                        >
                          <img
                            src={doc.url}
                            alt={doc.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-5 h-5" />
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 w-full rounded-xl bg-slate-100 dark:bg-navy-900 border border-dashed border-slate-300 dark:border-navy-700 flex items-center justify-center text-[10px] text-slate-400">
                          {p.bank_account_no && doc.title.includes('Bank') ? (
                            <div className="text-center">
                              <p className="font-mono font-bold text-slate-700 dark:text-slate-300">A/C: ••••{p.bank_account_no.slice(-4)}</p>
                              <p className="text-[9px] text-slate-400">{p.bank_ifsc}</p>
                            </div>
                          ) : (
                            'Not Uploaded'
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Document Inspector Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-navy-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-navy-700">
            <div className="p-4 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{inspectingDoc.title}</h4>
              <button
                onClick={() => setInspectingDoc(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950">
              <img src={inspectingDoc.url} alt={inspectingDoc.title} className="max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
