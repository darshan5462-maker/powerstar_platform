import { Routes, Route } from 'react-router-dom'
import Sidebar              from '@/components/layout/Sidebar'
import CustomerHome         from '@/components/customer/CustomerHome'
import CustomerBook         from '@/components/customer/CustomerBook'
import CustomerBookings     from '@/components/customer/CustomerBookings'
import CustomerTrack        from '@/components/customer/CustomerTrack'
import CustomerProfile      from '@/components/customer/CustomerProfile'
import CustomerPayments     from '@/components/customer/CustomerPayments'
import CustomerReviews      from '@/components/customer/CustomerReviews'
import Notifications        from '@/components/customer/Notifications'
import { CustomerMobileNav } from '@/components/layout/MobileNav'

const NAV = [
  { icon:'🏠', label:'Dashboard',     path:'/dashboard',                section:'Main'    },
  { icon:'➕', label:'Book Service',  path:'/dashboard/book'                              },
  { icon:'📋', label:'My Bookings',   path:'/dashboard/bookings'                          },
  { icon:'📍', label:'Live Tracking', path:'/dashboard/track'                             },
  { icon:'💳', label:'Payments',      path:'/dashboard/payments'                          },
  { icon:'⭐', label:'Reviews',       path:'/dashboard/reviews'                           },
  { icon:'🔔', label:'Notifications', path:'/dashboard/notifications'                     },
  { icon:'👤', label:'Profile',       path:'/dashboard/profile',        section:'Account' },
]

export default function CustomerDashboard() {
  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* Sidebar — hidden on mobile via CSS */}
      <div className="desktop-only">
        <Sidebar items={NAV} basePath="/dashboard" />
      </div>

      {/* Main content */}
      <main style={{ flex:1, minWidth:0, background:'var(--bg)', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <Routes>
          <Route index                    element={<CustomerHome />}     />
          <Route path="book"              element={<CustomerBook />}     />
          <Route path="bookings"          element={<CustomerBookings />} />
          <Route path="track"             element={<CustomerTrack />}    />
          <Route path="payments"          element={<CustomerPayments />} />
          <Route path="reviews"           element={<CustomerReviews />}  />
          <Route path="notifications"     element={<Notifications />}    />
          <Route path="profile"           element={<CustomerProfile />}  />
          <Route path="*"                 element={<CustomerHome />}     />
        </Routes>
      </main>

      {/* Bottom nav — shown on mobile only */}
      <CustomerMobileNav />
    </div>
  )
}
