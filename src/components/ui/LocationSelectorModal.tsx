import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, Home, Briefcase, Plus, Check, X, Search } from 'lucide-react'
import { DISTRICTS, getCities } from '@/data/karnataka'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface LocationSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  currentLocation: {
    district: string
    city: string
    address?: string
    title?: string
  }
  onSelectLocation: (loc: { district: string; city: string; address: string; title?: string }) => void
}

export default function LocationSelectorModal({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation
}: LocationSelectorModalProps) {
  const { profile } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'districts' | 'saved' | 'manual'>('districts')
  const [searchDistrict, setSearchDistrict] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState(currentLocation.district || 'Bengaluru Urban')
  const [selectedCity, setSelectedCity] = useState(currentLocation.city || 'Koramangala')
  const [manualAddress, setManualAddress] = useState(currentLocation.address || '')
  const [addressTag, setAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home')
  const [detectingGps, setDetectingGps] = useState(false)

  if (!isOpen) return null

  const filteredDistricts = DISTRICTS.filter(d =>
    d.name.toLowerCase().includes(searchDistrict.toLowerCase()) ||
    d.nameKn?.toLowerCase().includes(searchDistrict.toLowerCase())
  )

  const currentDistrictObj = DISTRICTS.find(d => d.name === selectedDistrict) || DISTRICTS[0]
  const cities = getCities(currentDistrictObj.id)

  function handleGpsAutoDetect() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setDetectingGps(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setDetectingGps(false)
        const detectedLoc = {
          district: 'Bengaluru Urban',
          city: 'Current GPS Location',
          address: `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          title: 'Current Location'
        }
        onSelectLocation(detectedLoc)
        toast.success('Location updated from GPS 📍')
        onClose()
      },
      err => {
        setDetectingGps(false)
        toast.error('Could not get GPS location. Please select district.')
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function handleConfirmDistrictCity() {
    onSelectLocation({
      district: selectedDistrict,
      city: selectedCity || currentDistrictObj.name,
      address: `${selectedCity || currentDistrictObj.name}, ${selectedDistrict}, Karnataka`,
      title: `${selectedCity || selectedDistrict}`
    })
    toast.success(`Service location set to ${selectedDistrict}`)
    onClose()
  }

  function handleConfirmManual() {
    if (!manualAddress.trim()) {
      toast.error('Please enter a street or building address')
      return
    }
    onSelectLocation({
      district: selectedDistrict,
      city: selectedCity || currentDistrictObj.name,
      address: manualAddress,
      title: addressTag
    })
    toast.success(`Address saved for ${addressTag}`)
    onClose()
  }

  const SAVED_PRESETS = [
    { title: 'Home', icon: Home, address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru', district: 'Bengaluru Urban', city: 'Bellandur' },
    { title: 'Work', icon: Briefcase, address: 'Tower B, Tech Park, Outer Ring Road, Bengaluru', district: 'Bengaluru Urban', city: 'Marathahalli' },
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full max-w-lg bg-white dark:bg-navy-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-navy-700 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-navy-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Select Service Location</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Where should we send your service professional?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-navy-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick GPS Auto Detect Button */}
          <div className="px-5 pt-4 pb-2">
            <button
              type="button"
              disabled={detectingGps}
              onClick={handleGpsAutoDetect}
              className="w-full py-3 px-4 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/60 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-between hover:bg-primary-100/70 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Navigation className={`w-4 h-4 text-primary-500 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? 'Detecting your GPS location…' : 'Use Current Device Location'}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-500 text-white">
                GPS
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div className="px-5 py-2">
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-navy-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('districts')}
                className={`py-2 rounded-lg transition-all ${
                  activeTab === 'districts'
                    ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                District & City
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('saved')}
                className={`py-2 rounded-lg transition-all ${
                  activeTab === 'saved'
                    ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Saved Addresses
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`py-2 rounded-lg transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-brand-500 text-brand-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Custom Address
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-5 overflow-y-auto flex-1">
            {/* TAB 1: DISTRICTS & CITIES */}
            {activeTab === 'districts' && (
              <div className="space-y-4">
                {/* Search district input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search 31 Karnataka districts..."
                    value={searchDistrict}
                    onChange={e => setSearchDistrict(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* District Chips */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select District (31 Karnataka Districts Covered)
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                    {filteredDistricts.map(d => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDistrict(d.name)
                          const cityList = getCities(d.id)
                          setSelectedCity(cityList[0] || d.name)
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                          selectedDistrict === d.name
                            ? 'bg-brand-500 text-white border-brand-500 font-bold shadow-sm'
                            : 'bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-navy-700 hover:border-brand-400'
                        }`}
                      >
                        {d.name} {d.nameKn ? `(${d.nameKn})` : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cities in selected district */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select Area / City in {selectedDistrict}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {cities.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedCity(c)}
                        className={`text-xs p-2 rounded-xl border text-left flex items-center justify-between transition-all ${
                          selectedCity === c
                            ? 'bg-brand-50/70 dark:bg-brand-500/20 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold'
                            : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate">{c}</span>
                        {selectedCity === c && <Check className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SAVED PRESETS */}
            {activeTab === 'saved' && (
              <div className="space-y-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Select from your saved delivery locations
                </p>
                {SAVED_PRESETS.map((preset, idx) => {
                  const Icon = preset.icon
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelectLocation({
                          district: preset.district,
                          city: preset.city,
                          address: preset.address,
                          title: preset.title
                        })
                        toast.success(`Selected ${preset.title} location`)
                        onClose()
                      }}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-navy-700 hover:border-brand-500 bg-white dark:bg-navy-800 cursor-pointer transition-all flex items-start gap-3"
                    >
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white">{preset.title}</h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-700 text-slate-500 font-mono">
                            {preset.city}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {preset.address}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* TAB 3: CUSTOM MANUAL ADDRESS */}
            {activeTab === 'manual' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Address Label
                  </label>
                  <div className="flex gap-2">
                    {(['Home', 'Work', 'Other'] as const).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAddressTag(tag)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          addressTag === tag
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-navy-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    House / Flat / Street / Landmark Details
                  </label>
                  <textarea
                    rows={3}
                    value={manualAddress}
                    onChange={e => setManualAddress(e.target.value)}
                    placeholder="e.g. Flat 301, Sunshine Heights, 12th Main Road, Near Metro Station..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-navy-800/60 border-t border-slate-100 dark:border-navy-800">
            {activeTab === 'districts' && (
              <button
                type="button"
                onClick={handleConfirmDistrictCity}
                className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2"
              >
                Set Location to {selectedCity || selectedDistrict}
              </button>
            )}

            {activeTab === 'manual' && (
              <button
                type="button"
                onClick={handleConfirmManual}
                className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-brand transition-all flex items-center justify-center gap-2"
              >
                Save & Set Delivery Address
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
