import { useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'

const DISPUTES = [
  {ref:'PS-28400',title:'Refund Request — Incomplete Work',      desc:'Customer reports plumber left without completing bathroom fitting. Amount: ₹1,200',    customer:'Kavitha Murthy', provider:'Suresh Kumar',  amount:1200,date:'Jun 15'},
  {ref:'PS-28350',title:'Provider No-Show',                     desc:'Provider accepted job but never arrived. Customer waited 2+ hours. Refund: ₹480',        customer:'Priya Sharma',   provider:'Ganesh B.',     amount:480, date:'Jun 13'},
  {ref:'PS-28280',title:'Overcharging Complaint',               desc:'Driver charged ₹300 extra beyond quoted Tata Ace price. Partial refund requested.',      customer:'Sunil Gowda',    provider:'Ravi Transport',amount:300, date:'Jun 11'},
]

export default function AdminDisputes() {
  const [resolved, setResolved] = useState<string[]>([])

  function resolve(ref: string, action: string, msg: string) {
    setResolved(r=>[...r,ref])
    toast.success(msg)
  }

  const open = DISPUTES.filter(d=>!resolved.includes(d.ref))
  const done = DISPUTES.filter(d=>resolved.includes(d.ref))

  return (
    <div>
      <PageHeader title="Disputes" subtitle={`${open.length} open · ${done.length} resolved`} />
      <div className="page-content" style={{maxWidth:780}}>
        {open.length===0 && (
          <div className="glass" style={{padding:48,textAlign:'center'}}>
            <p style={{fontSize:40,marginBottom:12}}>✅</p>
            <p style={{color:'var(--text2)',fontSize:15}}>All disputes resolved!</p>
          </div>
        )}
        {open.map(d=>(
          <div key={d.ref} className="glass" style={{padding:22,marginBottom:14}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
              <div>
                <p style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>Booking #{d.ref} · {d.date}</p>
                <p style={{fontWeight:700,fontSize:15,marginBottom:6}}>{d.title}</p>
              </div>
              <span className="badge badge-red">Open</span>
            </div>
            <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.6,marginBottom:12}}>{d.desc}</p>
            <div style={{display:'flex',gap:16,fontSize:12,color:'var(--text2)',marginBottom:16}}>
              <span>👤 Customer: <strong style={{color:'var(--text)'}}>{d.customer}</strong></span>
              <span>👷 Provider: <strong style={{color:'var(--text)'}}>{d.provider}</strong></span>
              <span>💰 Amount: <strong style={{color:'var(--brand)'}}>₹{d.amount.toLocaleString('en-IN')}</strong></span>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <button className="btn btn-success btn-sm" onClick={()=>resolve(d.ref,'refund',`Refund ₹${d.amount} issued to ${d.customer} ✅`)}>
                Issue Refund ₹{d.amount.toLocaleString('en-IN')}
              </button>
              <button className="btn btn-danger btn-sm" onClick={()=>resolve(d.ref,'denied',`Refund denied for ${d.ref}`)}>
                Deny Refund
              </button>
              <button className="btn btn-outline btn-sm" onClick={()=>resolve(d.ref,'rebook',`Rebook scheduled for ${d.customer}`)}>
                Rebook Worker
              </button>
            </div>
          </div>
        ))}
        {done.length>0 && (
          <div>
            <p style={{fontSize:12,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.8px',margin:'20px 0 12px'}}>Resolved</p>
            {done.map(d=>(
              <div key={d.ref} className="glass" style={{padding:16,marginBottom:10,opacity:0.6}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <p style={{fontSize:11,color:'var(--text3)'}}>{d.ref}</p>
                    <p style={{fontSize:14,fontWeight:600}}>{d.title}</p>
                  </div>
                  <span className="badge badge-green">Resolved</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
