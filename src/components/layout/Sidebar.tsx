import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Users,
  ShieldCheck,
  Settings,
  Briefcase,
  DollarSign,
  FileCheck,
  Star,
  User,
  LogOut,
  Zap,
  MapPin,
  Activity,
  Grid,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

interface SidebarItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export default function Sidebar({ role }: { role: 'customer' | 'provider' | 'admin' }) {
  const { profile, reset } = useAuthStore()
  const nav = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await authService.signOut()
    reset()
    toast.success('Signed out successfully')
    nav('/')
  }

  let items: SidebarItem[] = []

  if (role === 'admin') {
    items = [
      { id: 'overview', label: 'Overview Dashboard', path: '/admin', icon: LayoutDashboard },
      { id: 'bookings', label: 'Manage Bookings', path: '/admin/bookings', icon: Calendar, badge: 'Live' },
      { id: 'providers', label: 'Service Providers', path: '/admin/providers', icon: Users },
      { id: 'kyc', label: 'KYC Document Desk', path: '/admin/kyc', icon: ShieldCheck },
      { id: 'services', label: 'Services & Rates', path: '/admin/services', icon: Grid },
      { id: 'disputes', label: 'Disputes & Support', path: '/admin/disputes', icon: Activity },
      { id: 'settings', label: 'Platform Settings', path: '/admin/settings', icon: Settings },
    ]
  } else if (role === 'provider') {
    items = [
      { id: 'jobs', label: 'Assigned Jobs', path: '/provider', icon: Briefcase, badge: 'Jobs' },
      { id: 'earnings', label: 'Earnings & Payouts', path: '/provider/earnings', icon: DollarSign },
      { id: 'kyc', label: 'KYC Documents', path: '/provider/kyc', icon: FileCheck },
      { id: 'reviews', label: 'Ratings & Reviews', path: '/provider/reviews', icon: Star },
      { id: 'profile', label: 'Provider Profile', path: '/provider/profile', icon: User },
    ]
  } else {
    items = [
      { id: 'home', label: 'Explore Services', path: '/dashboard', icon: LayoutDashboard },
      { id: 'book', label: 'Book a Service', path: '/dashboard/book', icon: Grid },
      { id: 'track', label: 'Live Tracking', path: '/dashboard/track', icon: Activity, badge: 'Active' },
      { id: 'bookings', label: 'My Bookings', path: '/dashboard/bookings', icon: Calendar },
      { id: 'profile', label: 'Account & Settings', path: '/dashboard/profile', icon: User },
    ]
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-navy-900 border-r border-navy-800 text-slate-200 h-screen sticky top-0 flex-shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => nav('/')}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-brand">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h2 className="font-extrabold text-base text-white tracking-wider font-display">
              POWERSTAR
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                {role === 'admin' ? 'Admin Suite' : role === 'provider' ? 'Partner Desk' : 'Marketplace'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {items.map(item => {
          const Icon = item.icon
          const isActive =
            item.path === '/dashboard' || item.path === '/provider' || item.path === '/admin'
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => nav(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                isActive
                  ? 'bg-brand-500 text-white shadow-brand font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-navy-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Card & Logout */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/50">
        <div className="p-2.5 rounded-xl bg-navy-800/60 border border-navy-700/60 mb-2 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-primary-500 flex items-center justify-center font-bold text-white text-xs">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-xs text-white truncate">
              {profile?.full_name || 'Powerstar User'}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-brand-400" />
              {profile?.district || 'Karnataka'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
