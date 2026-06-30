import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import ProviderHome     from '@/components/provider/ProviderHome'
import ProviderJobs     from '@/components/provider/ProviderJobs'
import ProviderEarnings from '@/components/provider/ProviderEarnings'
import ProviderKyc      from '@/components/provider/ProviderKyc'
import ProviderProfile  from '@/components/provider/ProviderProfile'

const NAV = [
  { icon:'🏠', label:'Dashboard',    path:'/provider',             section:'Main' },
  { icon:'📩', label:'Job Requests', path:'/provider/jobs' },
  { icon:'📋', label:'My Jobs',      path:'/provider/myjobs' },
  { icon:'💰', label:'Earnings',     path:'/provider/earnings' },
  { icon:'⭐', label:'Reviews',      path:'/provider/reviews' },
  { icon:'📄', label:'KYC Docs',     path:'/provider/kyc' },
  { icon:'👤', label:'Profile',      path:'/provider/profile',     section:'Account' },
]

export default function ProviderDashboard() {
  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar items={NAV} basePath="/provider" />
      <main style={{ flex:1, minWidth:0, background:'var(--bg)', minHeight:'100vh' }}>
        <Routes>
          <Route index           element={<ProviderHome />} />
          <Route path="jobs"     element={<ProviderJobs />} />
          <Route path="myjobs"   element={<ProviderJobs myJobs />} />
          <Route path="earnings" element={<ProviderEarnings />} />
          <Route path="kyc"      element={<ProviderKyc />} />
          <Route path="profile"  element={<ProviderProfile />} />
          <Route path="*"        element={<ProviderHome />} />
        </Routes>
      </main>
    </div>
  )
}
