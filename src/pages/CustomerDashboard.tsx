import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { CustomerMobileNav } from '@/components/layout/MobileNav'
import CustomerHome from '@/components/customer/CustomerHome'
import CustomerBook from '@/components/customer/CustomerBook'
import CustomerBookings from '@/components/customer/CustomerBookings'
import CustomerTrack from '@/components/customer/CustomerTrack'
import CustomerProfile from '@/components/customer/CustomerProfile'

export default function CustomerDashboard() {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950">
      {/* Desktop Persistent Sidebar */}
      <Sidebar role="customer" />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <Routes>
          <Route index element={<CustomerHome />} />
          <Route path="book" element={<CustomerBook />} />
          <Route path="bookings" element={<CustomerBookings />} />
          <Route path="track" element={<CustomerTrack />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      {/* Mobile Fixed Bottom Navigation */}
      <CustomerMobileNav />
    </div>
  )
}
