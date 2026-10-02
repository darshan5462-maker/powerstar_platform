import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Grid,
  Calendar,
  Activity,
  User,
  Briefcase,
  DollarSign,
  FileCheck,
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

interface TabItem {
  id: string
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

// ── CUSTOMER MOBILE BOTTOM NAVIGATION ──
export function CustomerMobileNav() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const [activeCount, setActiveCount] = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    const fetchCounts = async () => {
      try {
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', profile.id)
          .in('status', ['pending_admin', 'provider_assigned', 'payment_pending', 'confirmed', 'in_progress'])

        setActiveCount(count || 0)
      } catch (e) {
        // ignore
      }
    }
    fetchCounts()
  }, [profile?.id, location.pathname])

  const tabs: TabItem[] = [
    { id: 'home', label: 'Home', path: '/dashboard', icon: Home },
    { id: 'services', label: 'Services', path: '/dashboard/book', icon: Grid },
    { id: 'bookings', label: 'Bookings', path: '/dashboard/bookings', icon: Calendar },
    { id: 'track', label: 'Track', path: '/dashboard/track', icon: Activity, badge: activeCount > 0 ? activeCount : undefined },
    { id: 'profile', label: 'Profile', path: '/dashboard/profile', icon: User },
  ]

  return <BottomTabBar tabs={tabs} />
}

// ── PROVIDER MOBILE BOTTOM NAVIGATION ──
export function ProviderMobileNav() {
  const { profile } = useAuthStore()
  const location = useLocation()
  const [assignedCount, setAssignedCount] = useState(0)

  useEffect(() => {
    if (!profile?.id) return
    const fetchPending = async () => {
      try {
        const { count } = await supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('provider_id', profile.id)
          .in('status', ['provider_assigned', 'payment_pending', 'confirmed', 'in_progress'])

        setAssignedCount(count || 0)
      } catch (e) {
        // ignore
      }
    }
    fetchPending()
  }, [profile?.id, location.pathname])

  const tabs: TabItem[] = [
    { id: 'provider-home', label: 'Jobs', path: '/provider', icon: Briefcase, badge: assignedCount > 0 ? assignedCount : undefined },
    { id: 'provider-earnings', label: 'Earnings', path: '/provider/earnings', icon: DollarSign },
    { id: 'provider-kyc', label: 'KYC Verification', path: '/provider/kyc', icon: FileCheck },
    { id: 'provider-profile', label: 'Profile', path: '/provider/profile', icon: User },
  ]

  return <BottomTabBar tabs={tabs} />
}

// ── ADMIN MOBILE BOTTOM NAVIGATION ──
export function AdminMobileNav() {
  const tabs: TabItem[] = [
    { id: 'admin-overview', label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { id: 'admin-bookings', label: 'Bookings', path: '/admin/bookings', icon: Calendar },
    { id: 'admin-providers', label: 'Providers', path: '/admin/providers', icon: Users },
    { id: 'admin-kyc', label: 'KYC Approval', path: '/admin/kyc', icon: ShieldCheck },
    { id: 'admin-settings', label: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  return <BottomTabBar tabs={tabs} />
}

// Generic reusable bottom bar component
function BottomTabBar({ tabs }: { tabs: TabItem[] }) {
  const nav = useNavigate()
  const location = useLocation()

  return (
    <div className="lg:hidden">
      {/* Spacer so bottom bar doesn't overlay page content */}
      <div className="h-16 w-full" />

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-navy-800 px-2 py-1 shadow-floating">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive =
              tab.path === '/dashboard' || tab.path === '/provider' || tab.path === '/admin'
                ? location.pathname === tab.path
                : location.pathname.startsWith(tab.path)

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => nav(tab.path)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] rounded-xl transition-all duration-150 active:scale-95 ${
                  isActive
                    ? 'text-brand-500 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 text-[10px] font-extrabold text-white bg-brand-500 rounded-full flex items-center justify-center pulse-badge">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'font-bold text-brand-600 dark:text-brand-400' : 'font-medium'}`}>
                  {tab.label}
                </span>

                {/* Active bottom indicator pill */}
                {isActive && (
                  <span className="absolute -bottom-1 w-5 h-0.5 rounded-full bg-brand-500 shadow-sm" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
