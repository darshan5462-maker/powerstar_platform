import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'
import { useAuthStore } from '@/store/authStore'
import { getProviderBookings } from '@/services/bookingService'

export default function ProviderJobs({ myJobs=false }: { myJobs?: boolean }) {
  const { profile } = useAuthStore()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      getProviderBookings(profile.id).then(data => {
        setJobs(data)
        setLoading(false)
      })
    }
  }, [profile?.id])

  if (!myJobs) {
    return (
      <div>
        <PageHeader title="Job Requests" subtitle="Assigned jobs to you" />
        <div className="page-content" style={{maxWidth:640}}>
           {/* Not used directly in new flow, ProviderHome handles requests */}
           <p style={{color:'var(--text2)', padding: 20}}>Please use the dashboard home page to manage incoming assigned requests.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="My Jobs" subtitle="All your bookings" />
      <div className="page-content">
        <div className="glass" style={{overflow:'hidden'}}>
          <table className="data-table">
            <thead><tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{textAlign:'center', padding:40}}>Loading...</td></tr>
              ) : jobs.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign:'center', padding:40, color:'var(--text2)'}}>No jobs found.</td></tr>
              ) : jobs.map(j=>(
                <tr key={j.id}>
                  <td><span style={{fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'var(--text2)'}}>{j.booking_ref}</span></td>
                  <td style={{fontWeight:500}}>{j.customer?.full_name}</td>
                  <td>{j.category?.icon} {j.category?.name}</td>
                  <td style={{color:'var(--text2)',fontSize:12}}>{new Date(j.created_at).toLocaleDateString()}</td>
                  <td style={{fontWeight:700,color:'var(--brand)'}}>₹{j.total_amount?.toLocaleString('en-IN')}</td>
                  <td><StatusBadge status={j.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
