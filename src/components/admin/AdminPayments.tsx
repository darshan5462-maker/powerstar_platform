import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/ui/Badge'

interface Payment {
  id: string
  booking_id: string
  amount: number
  platform_fee: number
  provider_payout: number
  status: string
  method: string
  razorpay_payment_id: string | null
  created_at: string
  booking?: { booking_ref?: string; district?: string } | null
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('payments')
      .select('id,booking_id,amount,platform_fee,provider_payout,status,method,razorpay_payment_id,created_at,booking:bookings!payments_booking_id_fkey(booking_ref,district)')
      .order('created_at', { ascending: false })
      .limit(250)
    if (queryError) {
      setError('Payment history could not be loaded right now.')
      setPayments([])
    } else {
      setPayments((data ?? []) as Payment[])
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => payments.filter(payment => {
    const matchesStatus = status === 'all' || payment.status === status
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || payment.booking?.booking_ref?.toLowerCase().includes(q) || payment.booking?.district?.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  }), [payments, search, status])

  const total = filtered.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  return (
    <div>
      <PageHeader title="Payments" subtitle={`${payments.length} payment records`} action={<button className="btn btn-outline btn-sm" onClick={() => void load()} disabled={loading}>↻ Refresh</button>} />
      <div className="page-content">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }}>
          {[
            ['Visible volume', `₹${Math.round(total).toLocaleString('en-IN')}`, 'var(--brand)'],
            ['Held', payments.filter(p => p.status === 'held').length, '#2563eb'],
            ['Settled', payments.filter(p => p.status === 'released').length, '#16a34a'],
          ].map(([label, value, color]) => <div className="glass" key={label as string} style={{ padding:16 }}><p style={{ color:'var(--text2)', fontSize:12 }}>{label}</p><p style={{ color:color as string, fontWeight:800, fontSize:22, marginTop:5 }}>{value}</p></div>)}
        </div>
        <div style={{ display:'flex', gap:12, marginBottom:18, flexWrap:'wrap' }}>
          <input className="input" style={{ maxWidth:320 }} placeholder="Search booking or district…" value={search} onChange={event => setSearch(event.target.value)} />
          <select className="input" style={{ maxWidth:180 }} value={status} onChange={event => setStatus(event.target.value)}>
            <option value="all">All statuses</option><option value="pending">Pending</option><option value="held">Held</option><option value="released">Released</option><option value="refunded">Refunded</option><option value="failed">Failed</option>
          </select>
        </div>
        {loading ? <div className="glass" style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading payments…</div> : error ? <div className="glass" role="alert" style={{ padding:48, textAlign:'center' }}><p style={{ marginBottom:12 }}>{error}</p><button className="btn btn-outline btn-sm" onClick={() => void load()}>Try again</button></div> : filtered.length === 0 ? <div className="glass" style={{ padding:48, textAlign:'center', color:'var(--text2)' }}>No payments match these filters.</div> : <div className="glass" style={{ overflow:'auto' }}><table className="data-table"><thead><tr><th>Booking</th><th>District</th><th>Amount</th><th>Provider payout</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>{filtered.map(payment => <tr key={payment.id}><td style={{ fontFamily:'monospace', fontSize:11 }}>{payment.booking?.booking_ref ?? payment.booking_id.slice(0,8)}</td><td>{payment.booking?.district ?? '—'}</td><td style={{ fontWeight:700 }}>₹{Number(payment.amount || 0).toLocaleString('en-IN')}</td><td>₹{Number(payment.provider_payout || 0).toLocaleString('en-IN')}</td><td style={{ textTransform:'uppercase', fontSize:11 }}>{payment.method}</td><td><StatusBadge status={payment.status} /></td><td style={{ color:'var(--text2)', fontSize:11 }}>{new Date(payment.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</td></tr>)}</tbody></table></div>}
      </div>
    </div>
  )
}
