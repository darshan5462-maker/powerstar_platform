import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Phone,
  MapPin,
  Save,
  LogOut,
  ShieldCheck,
  Star,
  Briefcase,
  Moon,
  Sun,
  Globe,
  Award
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authService } from '@/services/authService'
import { DISTRICTS, getCities } from '@/data/karnataka'
import { supabase } from '@/lib/supabase'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

export default function ProviderProfile() {
  const nav = useNavigate()
  const { profile, setProfile, reset } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [district, setDistrict] = useState(profile?.district || 'Bengaluru Urban')
  const [city, setCity] = useState(profile?.city || 'Koramangala')
  const [bio, setBio] = useState('Certified electrician & appliance repair professional with 6+ years experience in Bengaluru.')
  const [experience, setExperience] = useState('6')
  const [saving, setSaving] = useState(false)

  const districtObj = DISTRICTS.find(d => d.name === district) || DISTRICTS[0]
  const cities = getCities(districtObj.id)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    try {
      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          district,
          city,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      await supabase
        .from('providers')
        .update({
          bio,
          experience_years: parseInt(experience, 10) || 1
        })
        .eq('id', profile.id)

      setProfile({
        ...profile,
        full_name: fullName,
        phone,
        district,
        city
      })
      toast.success('Partner profile updated!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update')
    } finally {
      setSaving(false)
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
      <HeaderBar title="Partner Profile & Trade" subtitle="Manage your trade specialization, service district & contact info" showLocation={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Profile Header */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center font-extrabold text-2xl">
            👷
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                {profile?.full_name || 'Powerstar Partner'}
              </h2>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {profile?.phone || 'No phone'} • 📍 {profile?.district || 'Karnataka'}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Certified Partner
              </span>
              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400" /> 4.9 Rating
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-navy-800">
            Professional Profile Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bio & Skill Highlights
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-colors flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving…' : 'Save Profile'}</span>
          </button>
        </form>

        {/* Preferences */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-4">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-navy-800">
            Appearance & Preferences
          </h3>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-navy-800 border border-slate-200 dark:border-navy-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900 dark:text-white">Dark Theme</p>
                <p className="text-[11px] text-slate-400">Toggle dark / light appearance</p>
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
        </div>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs border border-red-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Partner Account</span>
        </button>
      </main>
    </div>
  )
}
