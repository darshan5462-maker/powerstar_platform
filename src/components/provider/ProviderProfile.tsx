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
  Zap,
  CheckCircle2,
  Plus,
  X,
  Clock,
  Compass,
  DollarSign,
  Award
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { authService } from '@/services/authService'
import { DISTRICTS, getCities } from '@/data/karnataka'
import { ALL_SERVICES } from '@/data/services'
import { supabase } from '@/lib/supabase'
import HeaderBar from '@/components/layout/HeaderBar'
import toast from 'react-hot-toast'

const SKILL_PRESETS_BY_TRADE: Record<string, string[]> = {
  electrician: ['Wiring & Rewiring', 'Inverter Installation', 'MCB / Fuse Box', 'Switches & Sockets', 'Fan & Lights', 'Geyser Connection', 'Appliance Repair', '3-Phase Industrial'],
  plumber: ['Pipe Leakage Repair', 'Tap & Mixer Fitting', 'Water Tank Cleaning', 'Bathroom Sanitary', 'Drainage Unblocking', 'Water Pump Motor', 'Pipeline Fitting'],
  driver: ['Manual LMV Cars', 'Automatic Transmission', 'Night Driving', 'Outstation Travel', 'Commercial HMV', 'Airport Transit', 'VIP Chauffeur'],
  'tata-ace': ['750kg Light Goods', 'Intra-City Logistics', 'Loading & Unloading', 'Furniture Shifting', 'E-commerce Delivery', 'Express Transit'],
  cleaning: ['Deep Home Cleaning', 'Kitchen Sanitization', 'Bathroom Deep Clean', 'Sofa & Carpet Wash', 'Floor Scrubbing', 'Move-in Cleaning'],
  carpenter: ['Furniture Assembly', 'Door & Window Repair', 'Lock Replacement', 'Modular Kitchen', 'Wood Polishing', 'Custom Wardrobes'],
  mason: ['Brick & Concrete Work', 'Tile & Marble Laying', 'Plastering & Repair', 'Compound Wall', 'Waterproofing', 'Civil Construction'],
  painter: ['Interior Wall Paint', 'Exterior Waterproofing', 'Texture Design', 'Wood & Metal Polish', 'Water Damage Patching'],
  construction: ['RCC Material Support', 'Concrete Mixing', 'Site Labor', 'Heavy Material Moving'],
  shifting: ['Packing & Boxing', 'Safe Loading', 'Furniture Dismantling', 'Unpacking Support']
}

export default function ProviderProfile() {
  const nav = useNavigate()
  const { profile, setProfile, reset } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [district, setDistrict] = useState(profile?.district || 'Bengaluru Urban')
  const [city, setCity] = useState(profile?.city || 'Koramangala')
  const [selectedTradeSlug, setSelectedTradeSlug] = useState('electrician')
  const [skillsTags, setSkillsTags] = useState<string[]>(['Wiring & Rewiring', 'Inverter Installation', 'MCB / Fuse Box'])
  const [customTagInput, setCustomTagInput] = useState('')
  const [hourlyRate, setHourlyRate] = useState('280')
  const [serviceRadius, setServiceRadius] = useState('25')
  const [experience, setExperience] = useState('6')
  const [bio, setBio] = useState('Certified professional technician offering high quality on-demand services across Karnataka.')
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const districtObj = DISTRICTS.find(d => d.name === district) || DISTRICTS[0]
  const cities = getCities(districtObj.id)

  const currentServiceObj = ALL_SERVICES.find(s => s.id === selectedTradeSlug) || ALL_SERVICES[0]

  // Load existing provider data from Supabase
  useEffect(() => {
    async function loadProviderInfo() {
      if (!profile?.id) return
      setLoadingData(true)
      try {
        const { data: provData } = await supabase
          .from('providers')
          .select('*, category:service_categories(*)')
          .eq('id', profile.id)
          .maybeSingle()

        if (provData) {
          let detectedTrade = provData.category?.slug
          if (!detectedTrade && provData.category_id) {
            const foundSvc = ALL_SERVICES.find(s => s.id === provData.category_id || s.name.toLowerCase() === provData.category_id.toLowerCase())
            if (foundSvc) detectedTrade = foundSvc.id
          }
          if (!detectedTrade && Array.isArray(provData.skills_tags)) {
            for (const svc of ALL_SERVICES) {
              if (provData.skills_tags.some((t: string) => t.toLowerCase().includes(svc.id) || t.toLowerCase().includes(svc.name.toLowerCase()))) {
                detectedTrade = svc.id
                break
              }
            }
          }
          if (detectedTrade) setSelectedTradeSlug(detectedTrade)
          if (provData.experience_years) setExperience(String(provData.experience_years))
          if (provData.hourly_rate) setHourlyRate(String(provData.hourly_rate))
          if (provData.service_radius) setServiceRadius(String(provData.service_radius))
          if (provData.bio) setBio(provData.bio)
          if (Array.isArray(provData.skills_tags) && provData.skills_tags.length > 0) {
            setSkillsTags(provData.skills_tags)
          }
        }
      } catch (err) {
        // use defaults
      } finally {
        setLoadingData(false)
      }
    }

    loadProviderInfo()
  }, [profile?.id])

  // When trade changes, update suggested presets if empty
  function handleSelectTrade(slug: string) {
    setSelectedTradeSlug(slug)
    const presets = SKILL_PRESETS_BY_TRADE[slug] || ['Certified Work', 'Fast Service', 'Local Expert']
    setSkillsTags(presets.slice(0, 4))
    const svc = ALL_SERVICES.find(s => s.id === slug)
    if (svc) {
      setHourlyRate(String(svc.basePrice))
    }
  }

  function handleToggleSkillTag(tag: string) {
    if (skillsTags.includes(tag)) {
      setSkillsTags(skillsTags.filter(t => t !== tag))
    } else {
      setSkillsTags([...skillsTags, tag])
    }
  }

  function handleAddCustomTag(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = customTagInput.trim()
    if (!trimmed) return
    if (!skillsTags.includes(trimmed)) {
      setSkillsTags([...skillsTags, trimmed])
      setCustomTagInput('')
      toast.success(`Added skill: ${trimmed}`)
    }
  }

  function handleRemoveSkillTag(tag: string) {
    setSkillsTags(skillsTags.filter(t => t !== tag))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) return
    setSaving(true)
    try {
      // 1. Resolve Category ID from Supabase
      let categoryId: string | null = null
      try {
        const { data: catData } = await supabase
          .from('service_categories')
          .select('id')
          .or(`slug.eq.${selectedTradeSlug},name.ilike.%${currentServiceObj.name}%`)
          .maybeSingle()
        if (catData?.id) categoryId = catData.id
      } catch (e) {
        // ignore
      }

      // 2. Update profiles table
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
      } catch (e) {
        // ignore
      }

      const finalBio = bio.trim() || `${currentServiceObj.name} Specialist with certified experience.`
      const finalSkills = Array.from(new Set([currentServiceObj.name, selectedTradeSlug, ...skillsTags]))

      // 3. Upsert providers table
      const providerPayload: any = {
        id: profile.id,
        bio: finalBio,
        experience_years: parseInt(experience, 10) || 1,
        hourly_rate: parseFloat(hourlyRate) || currentServiceObj.basePrice,
        service_radius: parseInt(serviceRadius, 10) || 25,
        skills_tags: finalSkills,
        kyc_status: 'verified',
        is_online: true,
        updated_at: new Date().toISOString()
      }

      if (categoryId) {
        providerPayload.category_id = categoryId
      }

      try {
        await supabase
          .from('providers')
          .upsert(providerPayload, { onConflict: 'id' })
      } catch (e) {
        // ignore
      }

      // 4. Update local auth state
      setProfile({
        ...profile,
        full_name: fullName,
        phone,
        district,
        city
      })

      toast.success('🎉 Partner trade & skills updated successfully!')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile')
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

  const activePresets = SKILL_PRESETS_BY_TRADE[selectedTradeSlug] || [
    'Quick Service',
    'Verified Tools',
    'Emergency 24x7',
    'Commercial Work'
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 pb-24 lg:pb-12">
      <HeaderBar title="Partner Profile & Trade Skills" subtitle="Set your primary service trade, skills & operating district" showLocation={false} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Profile Card Header */}
        <div className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 text-brand-500 flex items-center justify-center font-extrabold text-3xl shadow-sm flex-shrink-0">
              {currentServiceObj.icon || '👷'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  {fullName || 'Powerstar Partner'}
                </h2>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {phone || 'No phone'} • 📍 {district} ({city})
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 uppercase tracking-wider flex items-center gap-1">
                  <span>{currentServiceObj.icon}</span>
                  <span>{currentServiceObj.name} Professional</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                  KYC Verified
                </span>
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400" /> 4.9 Rating
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="p-6 rounded-3xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800 shadow-card space-y-6">
          {/* Section 1: Trade & Role Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-navy-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-brand-500" />
                  <span>Primary Trade / Role Specialization</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Choose your main trade so Powerstar Admin can assign you matching jobs
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-brand">
                {currentServiceObj.icon} {currentServiceObj.name}
              </span>
            </div>

            {/* Popular Trade Badges Quick Pick */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {[
                { slug: 'electrician', name: 'Electrician', icon: '⚡' },
                { slug: 'plumber', name: 'Plumber', icon: '🔧' },
                { slug: 'driver', name: 'Driver', icon: '🚗' },
                { slug: 'tata-ace', name: 'Tata Ace', icon: '🚐' },
                { slug: 'cleaning', name: 'House Cleaning', icon: '🧹' },
                { slug: 'carpenter', name: 'Carpenter', icon: '🪚' },
                { slug: 'mason', name: 'Mason / Gowndi', icon: '🧱' },
                { slug: 'painter', name: 'Painter', icon: '🎨' },
              ].map(trade => {
                const isSelected = selectedTradeSlug === trade.slug
                return (
                  <button
                    key={trade.slug}
                    type="button"
                    onClick={() => handleSelectTrade(trade.slug)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-brand-500 text-white border-brand-500 shadow-brand font-bold scale-[1.02]'
                        : 'bg-slate-50 dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:border-brand-500'
                    }`}
                  >
                    <span className="text-xl">{trade.icon}</span>
                    <span className="text-xs font-semibold truncate">{trade.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Or Select from Full 37+ Catalog */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Or select from all 37+ specialized categories:
              </label>
              <select
                value={selectedTradeSlug}
                onChange={e => handleSelectTrade(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              >
                {ALL_SERVICES.map(svc => (
                  <option key={svc.id} value={svc.id}>
                    {svc.icon} {svc.name} ({svc.nameKn || ''}) — {svc.type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Specific Sub-Skills & Tags */}
          <div className="space-y-3 pt-2">
            <div className="pb-2 border-b border-slate-100 dark:border-navy-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-brand-500" />
                <span>Specialized Skills & Capabilities</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select your specific skills in {currentServiceObj.name} to increase matching accuracy
              </p>
            </div>

            {/* Selected Skills Chips */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2.5 rounded-2xl bg-slate-50 dark:bg-navy-800/80 border border-slate-200/80 dark:border-navy-700">
              {skillsTags.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No skills selected yet. Click presets below.</span>
              ) : (
                skillsTags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-500 text-white text-xs font-bold shadow-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillTag(tag)}
                      className="hover:text-red-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Preset Suggestions for the Trade */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                Suggested skills for {currentServiceObj.name} (Click to toggle):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activePresets.map(preset => {
                  const isChecked = skillsTags.includes(preset)
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleToggleSkillTag(preset)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                        isChecked
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 font-bold'
                          : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:border-brand-500'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}{preset}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Skill Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom skill (e.g. Inverter Wiring, HMV Driver, 3-Phase)..."
                value={customTagInput}
                onChange={e => setCustomTagInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-navy-700 dark:hover:bg-navy-600 text-white font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Section 3: Basic Details & Location */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-navy-800">
              Personal & Operational Details
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
                  Operating District (Karnataka)
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
                  City / Local Hub
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Base / Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bio & Professional Highlights
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Briefly describe your specialization, work experience, certifications, and availability..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes…' : 'Save Partner Profile & Trade'}</span>
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
