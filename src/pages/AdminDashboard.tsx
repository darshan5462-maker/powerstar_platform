import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { AdminMobileNav } from '@/components/layout/MobileNav'
import AdminHome from '@/components/admin/AdminHome'
import AdminBookings from '@/components/admin/AdminBookings'
import AdminProviders from '@/components/admin/AdminProviders'
import AdminKyc from '@/components/admin/AdminKyc'
import AdminDisputes from '@/components/admin/AdminDisputes'
import AdminServices from '@/components/admin/AdminServices'
import AdminSettings from '@/components/admin/AdminSettings'

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      {/* Desktop Persistent Sidebar */}
      <Sidebar role="admin" />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Routes>
          <Route index element={<AdminHome />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="kyc" element={<AdminKyc />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <AdminMobileNav />
    </div>
  )
}
