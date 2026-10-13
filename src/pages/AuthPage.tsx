import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sun, Moon, Zap } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import AuthCard from '@/components/auth/AuthCard'
import { Role } from '@/store/authStore'

export default function AuthPage() {
  const { isDark, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const modeParam = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const roleParam = (searchParams.get('role') as Role) || 'customer'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Home & Theme Switcher */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700 hover:border-brand-500 transition-colors shadow-sm"
        >
          ← Return to Home
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-xl bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-navy-700 shadow-sm hover:text-brand-500 transition-colors"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 relative z-10">
        <div
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2.5 cursor-pointer mb-2"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-brand">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <span className="text-2xl font-black tracking-wider text-slate-900 dark:text-white font-display">
            POWER<span className="text-brand-500">STAR</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Karnataka's On-Demand Local Services Marketplace
        </p>
      </div>

      {/* Central Auth Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <AuthCard
          initialMode={modeParam}
          initialRole={roleParam}
          isModal={false}
        />
      </div>
    </div>
  )
}
