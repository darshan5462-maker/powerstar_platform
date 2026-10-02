import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { ProviderMobileNav } from '@/components/layout/MobileNav'
import ProviderHome from '@/components/provider/ProviderHome'
import ProviderEarnings from '@/components/provider/ProviderEarnings'
import ProviderKyc from '@/components/provider/ProviderKyc'
import ProviderProfile from '@/components/provider/ProviderProfile'

export default function ProviderDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      {/* Desktop Persistent Sidebar */}
      <Sidebar role="provider" />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Routes>
          <Route index element={<ProviderHome />} />
          <Route path="earnings" element={<ProviderEarnings />} />
          <Route path="kyc" element={<ProviderKyc />} />
          <Route path="reviews" element={<ProviderHome />} />
          <Route path="profile" element={<ProviderProfile />} />
          <Route path="*" element={<Navigate to="/provider" replace />} />
        </Routes>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <ProviderMobileNav />
    </div>
  )
}
