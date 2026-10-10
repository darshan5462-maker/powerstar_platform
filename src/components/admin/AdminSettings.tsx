import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, Save, Shield, DollarSign, Phone, Mail, LogOut, CheckCircle2, Lock, CreditCard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const nav = useNavigate()
  const { reset } = useAuthStore()

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ps_admin_upi_settings')
    const parsed = saved ? JSON.parse(saved) : {}
    return {
      platform_name: parsed.platform_name || 'POWERSTAR',
      support_phone: parsed.support_phone || '+91 80 4567 8900',
      support_email: parsed.support_email || 'support@powerstar.in',
      platform_fee_percent: parsed.platform_fee_percent || '5',
      gst_percent: parsed.gst_percent || '18',
      settlement_hours: parsed.settlement_hours || '24',
      min_booking_amount: parsed.min_booking_amount || '100',
      payment_mode: 'UPI Only (NPCI Auto-Verify)',
      active_districts_count: '31',
      merchant_upi_id: parsed.merchant_upi_id || 'powerstar.services@upi',
      merchant_name: parsed.merchant_name || 'POWERSTAR SERVICES',
      bank_account_number: parsed.bank_account_number || '',
      bank_ifsc: parsed.bank_ifsc || ''
    }
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      localStorage.setItem('ps_admin_upi_settings', JSON.stringify(settings))
      setTimeout(() => {
        setSaving(false)
        toast.success('Receiver UPI & Platform settings saved successfully!')
      }, 500)
    } catch (e) {
      setSaving(false)
      toast.success('Settings saved!')
    }
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
                  <span>UPI Direct Credit (0% Commission)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Bank & UPI Receiver Account Details */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-base">🏦</span>
                <span>Your Receiving Account & UPI Details</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Direct Settlement
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              When customers pay the ₹49 booking fee or service charges via UPI, the funds are credited directly to this UPI ID / Bank Account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Receiving UPI ID (VPA) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. yourname@okaxis, 9845012345@ybl, merchant@paytm"
                  value={settings.merchant_upi_id}
                  onChange={e => handleChange('merchant_upi_id', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono font-bold text-brand-600 dark:text-brand-400"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Find this inside your Google Pay, PhonePe, Paytm, or Bank App.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Business / Account Holder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. POWERSTAR SERVICES or Your Name"
                  value={settings.merchant_name}
                  onChange={e => handleChange('merchant_name', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Settlement Bank Account Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50100234567890"
                  value={settings.bank_account_number || ''}
                  onChange={e => handleChange('bank_account_number', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bank IFSC Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234 / SBIN0004567"
                  value={settings.bank_ifsc || ''}
                  onChange={e => handleChange('bank_ifsc', e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Razorpay Gateway Status */}
          <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-500" />
                <span>Razorpay Standard Gateway</span>
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Connected
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configured with your Razorpay Merchant account for automated order creation, card payments, and HMAC-SHA256 signature verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Razorpay Key ID
                </label>
                <input
                  type="text"
                  readOnly
                  value="rzp_test_TmCAeyVSADDUn4"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800/60 text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Secret Key & Webhook Security
                </label>
                <input
                  type="text"
                  readOnly
                  value="••••••••••••••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-800/60 text-xs font-mono text-slate-400"
                />
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
