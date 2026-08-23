import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import AdminHome      from '@/components/admin/AdminHome'
import AdminBookings  from '@/components/admin/AdminBookings'
import AdminProviders from '@/components/admin/AdminProviders'
import AdminKyc       from '@/components/admin/AdminKyc'
import AdminDisputes  from '@/components/admin/AdminDisputes'
import AdminServices  from '@/components/admin/AdminServices'
import AdminSettings  from '@/components/admin/AdminSettings'
import AdminCustomers from '@/components/admin/AdminCustomers'
import AdminPayments  from '@/components/admin/AdminPayments'
import AdminPricing   from '@/components/admin/AdminPricing'
import AdminMobileMenu, { AdminMobileNav } from '@/components/layout/AdminMobileNav'

const NAV = [
  { icon:'📊', label:'Dashboard',    path:'/admin',              section:'Analytics' },
  { icon:'📋', label:'All Bookings', path:'/admin/bookings' },
  { icon:'👷', label:'Providers',    path:'/admin/providers' },
  { icon:'👥', label:'Customers',    path:'/admin/customers' },
  { icon:'🔐', label:'KYC Review',   path:'/admin/kyc',          section:'Operations' },
  { icon:'💳', label:'Payments',     path:'/admin/payments' },
  { icon:'⚠️', label:'Disputes',     path:'/admin/disputes' },
  { icon:'🏷️', label:'Services',     path:'/admin/services' },
  { icon:'💰', label:'Pricing',      path:'/admin/pricing',      section:'Config' },
  { icon:'⚙️', label:'Settings',     path:'/admin/settings' },
]

export default function AdminDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar items={NAV} basePath="/admin" />
      <main style={{ flex:1, minWidth:0, background:'var(--bg)', minHeight:'100vh' }}>
        <Routes>
          <Route index            element={<AdminHome />} />
          <Route path="bookings"  element={<AdminBookings />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="payments"  element={<AdminPayments />} />
          <Route path="pricing"   element={<AdminPricing />} />
          <Route path="kyc"       element={<AdminKyc />} />
          <Route path="disputes"  element={<AdminDisputes />} />
          <Route path="services"  element={<AdminServices />} />
          <Route path="settings"  element={<AdminSettings />} />
          <Route path="*"         element={<AdminHome />} />
        </Routes>
      </main>
      <AdminMobileNav />
      <AdminMobileMenu open={menuOpen} onClose={() => setMenuOpen(value => !value)} />
    </div>
  )
}
