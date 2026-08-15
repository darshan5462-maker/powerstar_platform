import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import { useAuthStore } from '@/store/authStore'

// Inline sub-pages for brevity – each is a self-contained component
import CustomerHome     from '@/components/customer/CustomerHome'
import CustomerBook     from '@/components/customer/CustomerBook'
import CustomerBookings from '@/components/customer/CustomerBookings'
import CustomerTrack    from '@/components/customer/CustomerTrack'
import CustomerProfile  from '@/components/customer/CustomerProfile'

const NAV = [
  { icon:'🏠', label:'Dashboard',    path:'/dashboard',          section:'Main' },
  { icon:'➕', label:'Book Service',  path:'/dashboard/book' },
  { icon:'📋', label:'My Bookings',   path:'/dashboard/bookings', badge:0 },
  { icon:'📍', label:'Live Tracking', path:'/dashboard/track',    badge:0 },
  { icon:'💳', label:'Payments',      path:'/dashboard/payments' },
  { icon:'⭐', label:'Reviews',       path:'/dashboard/reviews' },
  { icon:'👤', label:'Profile',       path:'/dashboard/profile',  section:'Account' },
  { icon:'🔔', label:'Notifications', path:'/dashboard/notifications', badge:0 },
]

export default function CustomerDashboard() {
  const nav = useNavigate(); const loc = useLocation()
  return (
    <div style={{display:'flex'}}>
      <Sidebar items={NAV} basePath="/dashboard" />
      <main className="main-layout">
        <Routes>
          <Route index        element={<CustomerHome />} />
          <Route path="book"  element={<CustomerBook />} />
          <Route path="bookings" element={<CustomerBookings />} />
          <Route path="track" element={<CustomerTrack />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="*"     element={<CustomerHome />} />
        </Routes>
      </main>
    </div>
  )
}
