import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { loadDisputes() }, [])

  async function loadDisputes() {
    const { data } = await supabase
      .from('disputes')
      .select('*, booking:bookings(booking_ref, total_amount, district), customer:profiles!disputes_raised_by_fkey(full_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
    setDisputes(data ?? [])
    setLoading(false)
  }

  async function resolve(id: string, outcome: string, label: string) {
    await supabase.from('disputes').update({
      status: 'resolved', outcome,
      resolved_at: new Date().toISOString(),
    }).eq('id', id)
    setDisputes(prev => prev.filter(d => d.id !== id))
    toast.success(label)
  }

  // Mock disputes shown when DB is empty (for demo purposes)
  const MOCK = [
    { id:'m1', booking:{ booking_ref:'PS-28400', total_amount:1200, district:'Bengaluru' }, customer:{ full_name:'Kavitha Murthy' }, title:'Refund — Incomplete Work', description:'Customer reports plumber left without completing bathroom fitting.', created_at: new Date(Date.now()-86400000).toISOString() },
    { id:'m2', booking:{ booking_ref:'PS-28350', total_amount:480,  district:'Mysuru'    }, customer:{ full_name:'Priya Sharma'   }, title:'Provider No-Show',           description:'Provider accepted but never arrived. 2 hour wait.',       created_at: new Date(Date.now()-172800000).toISOString() },
  ]

  const display = disputes.length > 0 ? disputes : MOCK

  return (
    <div>
      <PageHeader title="Disputes" subtitle={`${display.length} open disputes`} />
      <div className="page-content" style={{ maxWidth:780 }}>
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading...</div>
        ) : display.length === 0 ? (
          <div className="glass" style={{ padding:48, textAlign:'center' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>✅</p>
            <p style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>No open disputes!</p>
            <p style={{ color:'var(--text2)', fontSize:13 }}>All disputes have been resolved.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {display.map((d:any) => (
              <div key={d.id} className="glass" style={{ padding:22 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                  <div>
                    <p style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>Booking #{d.booking?.booking_ref} · {d.booking?.district}</p>
                    <p style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{d.title}</p>
                  </div>
                  <span className="badge badge-red">Open</span>
                </div>
                <p style={{ fontSize:13, color:'var(--text2)', lineHeight:1.6, marginBottom:12 }}>{d.description}</p>
                <div style={{ display:'flex', gap:20, fontSize:12, color:'var(--text2)', marginBottom:16 }}>
                  <span>👤 Customer: <strong style={{ color:'var(--text)' }}>{d.customer?.full_name ?? '—'}</strong></span>
                  <span>💰 Amount: <strong style={{ color:'var(--brand)' }}>₹{(d.booking?.total_amount ?? 0).toLocaleString('en-IN')}</strong></span>
                  <span>📅 {new Date(d.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</span>
                </div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button className="btn btn-success btn-sm" onClick={()=>resolve(d.id,'refund_issued',`Refund ₹${d.booking?.total_amount?.toLocaleString('en-IN')} issued ✅`)}>
                    Issue Refund ₹{(d.booking?.total_amount ?? 0).toLocaleString('en-IN')}
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={()=>resolve(d.id,'refund_denied','Refund denied')}>
                    Deny Refund
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={()=>resolve(d.id,'rebook_scheduled','Rebook scheduled for customer')}>
                    Rebook Worker
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
