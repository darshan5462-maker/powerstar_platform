import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  Moon,
  Sun,
  Globe,
  HelpCircle,
  LogOut,
  Check,
  Home,
  Briefcase,
  Plus,
  Save,
  Trash2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authService } from '@/services/authService'
import { DISTRICTS, getCities } from '@/data/karnataka'
import { supabase } from '@/lib/supabase'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const { profile, setProfile, reset } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const nav = useNavigate()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [district, setDistrict] = useState(profile?.district || 'Bengaluru Urban')
  const [city, setCity] = useState(profile?.city || 'Koramangala')
  const [address, setAddress] = useState(profile?.address || '')
  const [saving, setSaving] = useState(false)
  const [language, setLanguage] = useState<'en' | 'kn'>('en')

  const currentDistrictObj = DISTRICTS.find(d => d.name === district) || DISTRICTS[0]
  const cities = getCities(currentDistrictObj.id)

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          district,
          city,
          address,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (error) throw error

      setProfile({
        ...profile,
        full_name: fullName,
        phone,
        district,
        city,
        address
      })
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await authService.signOut()
    reset()
    toast.success('Signed out successfully')
    nav('/')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Account & Settings" subtitle="Manage your profile, addresses & preferences" showLocation={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Profile Card Header */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-brand flex-shrink-0">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white truncate">
              {profile?.full_name || 'Powerstar User'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {profile?.phone || 'No phone added'} • {profile?.district || 'Karnataka'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 uppercase tracking-wider">
                Customer Account
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-navy-800">
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary District
              </label>
              <select
                value={district}
                onChange={e => {
                  setDistrict(e.target.value)
                  const dObj = DISTRICTS.find(d => d.name === e.target.value)
                  if (dObj) {
                    const cl = getCities(dObj.id)
                    setCity(cl[0] || e.target.value)
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {DISTRICTS.map(d => (
                  <option key={d.id} value={d.name}>{d.name} {d.nameKn ? `(${d.nameKn})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Area / City
              </label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Address (Flat, Street, Landmark)
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. #42, 3rd Cross, Koramangala 4th Block"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-colors flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving…' : 'Save Changes'}</span>
          </button>
        </form>

        {/* Preferences & App Settings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-navy-800">
            App Preferences
          </h3>

          <div className="space-y-3">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Dark Theme</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Switch app appearance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center ${
                  isDark ? 'bg-brand-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Language / ಭಾಷೆ</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Select interface language</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en')
                    toast.success('Language: English')
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    language === 'en' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('kn')
                    toast.success('ಭಾಷೆ: ಕನ್ನಡ')
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    language === 'kn' ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-navy-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  ಕನ್ನಡ
                </button>
              </div>
            </div>

            {/* Help & Support */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 space-y-2">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-brand-500" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Need Support?</h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                24x7 Customer Support Desk: <strong>+91 80 4567 8900</strong> • support@powerstar.in
              </p>
            </div>
          </div>
        </div>

        {/* Sign Out CTA */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs border border-red-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from POWERSTAR</span>
        </button>
      </main>
    </div>
  )
}
