import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, ChevronDown, Bell, Moon, Sun, Search, Zap, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import LocationSelectorModal from '@/components/ui/LocationSelectorModal'

interface HeaderBarProps {
  title?: string
  subtitle?: string
  showLocation?: boolean
}

export default function HeaderBar({ title, subtitle, showLocation = true }: HeaderBarProps) {
  const { profile, setProfile } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const nav = useNavigate()

  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [currentLoc, setCurrentLoc] = useState({
    district: profile?.district || 'Bengaluru Urban',
    city: profile?.city || 'Koramangala',
    address: profile?.address || 'Koramangala, Bengaluru, Karnataka',
    title: profile?.city || 'Bengaluru'
  })

  function handleSelectLocation(loc: { district: string; city: string; address: string; title?: string }) {
    setCurrentLoc(loc)
    if (profile) {
      setProfile({
        ...profile,
        district: loc.district,
        city: loc.city,
        address: loc.address
      })
    }
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-navy-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-navy-800 px-4 sm:px-6 py-3 transition-colors">
        <div className="flex items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* Left: Location or Title */}
          {showLocation ? (
            <div
              onClick={() => setLocationModalOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer group py-1 px-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4 fill-brand-500/20" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-none">
                  <span>Delivering in</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[160px] sm:max-w-xs mt-0.5">
                  {currentLoc.city || currentLoc.district}, {currentLoc.district}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {title && <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display">{title}</h1>}
              {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 flex items-center justify-center transition-colors"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile avatar button */}
            <button
              type="button"
              onClick={() => nav('/dashboard/profile')}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-slate-100 dark:bg-navy-800 hover:bg-slate-200 dark:hover:bg-navy-700 transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-[11px] font-bold text-white">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                {profile?.full_name?.split(' ')[0] || 'Profile'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Location Selector Sheet */}
      <LocationSelectorModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={currentLoc}
        onSelectLocation={handleSelectLocation}
      />
    </>
  )
}
