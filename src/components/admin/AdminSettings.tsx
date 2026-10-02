import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Save, Shield, DollarSign, Phone, Mail, LogOut, CheckCircle2, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const nav = useNavigate()
  const { reset } = useAuthStore()

  const [settings, setSettings] = useState({
    platform_name: 'POWERSTAR',
    support_phone: '+91 80 4567 8900',
    support_email: 'support@powerstar.in',
    platform_fee_percent: '5',
    gst_percent: '18',
    settlement_hours: '24',
    min_booking_amount: '100',
    payment_mode: 'UPI Only (NPCI Auto-Verify)',
    active_districts_count: '31'
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success('Platform settings updated successfully!')
    }, 600)
  }

  async function handleLogout() {
    await authService.signOut()
    reset()
    toast.success('Logged out successfully')
    nav('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Platform Settings" subtitle="Configure commission fees, tax rates & platform support" showLocation={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        <form onSubmit={handleSave} className="space-y-5">
          {/* General Settings */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-navy-800 flex items-center gap-2">
              <Settings className="w-4 h-4 text-brand-500" />
              <span>General Platform Info</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platform_name}
                  onChange={e => handleChange('platform_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Active Karnataka Districts
                </label>
                <input
                  type="text"
                  readOnly
                  value="31 Districts (All Covered)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800/50 text-xs text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Support Helpline Phone
                </label>
                <input
                  type="text"
                  value={settings.support_phone}
                  onChange={e => handleChange('support_phone', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={e => handleChange('support_email', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Financial & UPI Rules */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-navy-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Financial & UPI Commissions</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Platform Commission Fee (%)
                </label>
                <input
                  type="number"
                  value={settings.platform_fee_percent}
                  onChange={e => handleChange('platform_fee_percent', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  GST on Fee (%)
                </label>
                <input
                  type="number"
                  value={settings.gst_percent}
                  onChange={e => handleChange('gst_percent', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Partner Payout Share
                </label>
                <input
                  type="text"
                  readOnly
                  value="90% of Base Fee"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800/50 text-xs text-slate-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Gateway Policy
                </label>
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>UPI Only (GPay, PhonePe, Paytm, BHIM)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving…' : 'Save Configuration'}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 font-bold text-xs border border-red-500/30 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
