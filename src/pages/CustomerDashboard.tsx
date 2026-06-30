import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import CustomerHome     from '@/components/customer/CustomerHome'
import CustomerBook     from '@/components/customer/CustomerBook'
import CustomerBookings from '@/components/customer/CustomerBookings'
import CustomerTrack    from '@/components/customer/CustomerTrack'
import CustomerProfile  from '@/components/customer/CustomerProfile'

const NAV = [
  { icon:'🏠', label:'Dashboard',    path:'/dashboard',              section:'Main' },
  { icon:'➕', label:'Book Service',  path:'/dashboard/book' },
  { icon:'📋', label:'My Bookings',  path:'/dashboard/bookings' },
  { icon:'📍', label:'Live Tracking',path:'/dashboard/track' },
  { icon:'💳', label:'Payments',     path:'/dashboard/payments' },
  { icon:'⭐', label:'Reviews',      path:'/dashboard/reviews' },
  { icon:'👤', label:'Profile',      path:'/dashboard/profile',      section:'Account' },
  { icon:'🔔', label:'Notifications',path:'/dashboard/notifications' },
]

export default function CustomerDashboard() {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar items={NAV} basePath="/dashboard" />
      <main style={{ flex:1, minWidth:0, background:'var(--bg)', minHeight:'100vh' }}>
        <Routes>
          <Route index         element={<CustomerHome />} />
          <Route path="book"   element={<CustomerBook />} />
          <Route path="bookings" element={<CustomerBookings />} />
          <Route path="track"  element={<CustomerTrack />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="*"      element={<CustomerHome />} />
        </Routes>
      </main>
    </div>
  )
}
