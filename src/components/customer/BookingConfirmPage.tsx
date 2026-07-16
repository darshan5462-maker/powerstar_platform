import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

interface Props {
  svc: any; selectedProv: any; price: any
  address: string; city: string; district: string
  notes: string; setNotes: (v:string)=>void
  hours: number; svcType: string; rate: number
  onBack: ()=>void
}

export default function BookingConfirmPage({
  svc, selectedProv, price, address, city, district,
  notes, setNotes, hours, svcType, rate, onBack
}: Props) {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [payMethod, setPayMethod] = useState('upi')
  const [upiId,     setUpiId]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [bookingRef, setBookingRef] = useState('')

  async function confirmBooking() {
    if (!profile?.id) return
    if (payMethod === 'upi' && !upiId.trim()) {
      toast.error('Enter your UPI ID'); return
    }
    setLoading(true)
    try {
      const { data: cat } = await supabase
        .from('service_categories').select('id').eq('slug', svc.id).maybeSingle()

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          customer_id:    profile.id,
          category_id:    cat?.id || '00000000-0000-0000-0000-000000000000',
          address, city: city || district, district,
          base_amount:    price.base,
          platform_fee:   price.fee,
          gst_amount:     price.gst,
          total_amount:   price.total,
          customer_notes: notes || null,
          status:         'pending',
        })
        .select()
        .single()

      if (error) throw error

      // Send notification to provider
      await supabase.from('notifications').insert({
        user_id: selectedProv.id,
        title:   '🔔 New Job Request!',
        body:    `${profile.full_name} needs ${svc.name} in ${district}. ₹${price.total}`,
        type:    'booking',
        data:    { booking_id: booking.id, amount: price.total },
      })

      setBookingRef(booking.booking_ref || 'PS-' + Math.floor(Math.random()*99999))
      setDone(true)
      toast.success('Booking confirmed! 🎉')
    } catch (err: any) {
      toast.error(err?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  // ── SUCCESS SCREEN ──
  if (done) return (
    <div style={{ textAlign:'center', padding:'32px 20px' }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(22,163,74,0.1)', border:'3px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 20px' }}>✅</div>
      <h2 style={{ fontWeight:800, fontSize:22, fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:8 }}>Booking Confirmed!</h2>
      <p style={{ color:'var(--text2)', fontSize:14, marginBottom:20 }}>Your provider has been notified and will arrive shortly.</p>

      <div style={{ background:'var(--bg2)', borderRadius:14, padding:20, marginBottom:20, textAlign:'left' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[
            ['Booking ID',  bookingRef],
            ['Service',     svc.name],
            ['Provider',    selectedProv?.profile?.full_name ?? 'Provider'],
            ['Location',    `${city||district}, ${district}`],
            ['Amount',      '₹'+price.total],
            ['Payment',     payMethod.toUpperCase()],
          ].map(([k,v],i)=>(
            <div key={i}>
              <p style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>{k}</p>
              <p style={{ fontSize:13, fontWeight:600 }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background:'rgba(249,115,22,0.06)', border:'1px solid rgba(249,115,22,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:13 }}>
        <p style={{ fontWeight:700, color:'var(--brand)', marginBottom:4 }}>🔐 Your OTP will appear here</p>
        <p style={{ color:'var(--text2)', fontSize:12 }}>Share this OTP with the provider only when they arrive to start the job.</p>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={()=>nav('/dashboard/bookings')}>My Bookings</button>
        <button className="btn btn-brand"  style={{ flex:1 }} onClick={()=>nav('/dashboard/track')}>Track Live →</button>
      </div>
    </div>
  )

  // ── PAYMENT SCREEN ──
  return (
    <div>
      <h3 style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>Confirm & Pay</h3>

      {/* Provider summary */}
      <div style={{ display:'flex', gap:12, alignItems:'center', background:'var(--bg2)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
        <Avatar name={selectedProv?.profile?.full_name ?? 'P'} size={44} />
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:14 }}>{selectedProv?.profile?.full_name}</p>
          <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
            {svc.icon} {svc.name} · ★{selectedProv?.rating > 0 ? Number(selectedProv.rating).toFixed(1) : 'New'} · ✓ KYC Verified
          </p>
        </div>
        <span className="badge badge-green">Online</span>
      </div>

      {/* Location */}
      <div style={{ background:'var(--bg2)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'var(--text2)', display:'flex', gap:8, alignItems:'flex-start' }}>
        <span>📍</span>
        <span>{address}, {city || district}, {district}</span>
      </div>

      {/* Price breakdown */}
      <div style={{ background:'var(--bg2)', borderRadius:14, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontWeight:700, fontSize:13 }}>Price Breakdown</p>
        </div>
        <div style={{ padding:'14px 16px' }}>
          {[
            [`${svc.name} (${svcType==='manpower'?hours+' hrs × ₹'+rate:'1 trip'})`, price.base],
            ['Platform fee (5%)', price.fee],
            ['GST (18%)',          price.gst],
          ].map(([k, v], i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', marginBottom:8 }}>
              <span>{k}</span><span>₹{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:18, borderTop:'1px solid var(--border)', paddingTop:12, marginTop:4 }}>
            <span>Total</span>
            <span style={{ color:'var(--brand)' }}>₹{price.total}</span>
          </div>
          <p style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>💡 Amount charged only after job completion via OTP</p>
        </div>
      </div>

      {/* Special instructions */}
      <div style={{ marginBottom:16 }}>
        <label className="input-label">Special instructions (optional)</label>
        <textarea
          className="input"
          style={{ minHeight:70, resize:'none' }}
          placeholder="Enter from side gate, call on arrival, specific floor..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Payment method */}
      <div style={{ marginBottom:16 }}>
        <p style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Payment Method</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
          {[
            ['upi',    '📱', 'UPI',    'Instant transfer'],
            ['card',   '💳', 'Card',   'Debit / Credit'],
            ['wallet', '👛', 'Wallet', 'Paytm, PhonePe'],
            ['cash',   '💵', 'Cash',   'Pay on arrival'],
          ].map(([m, icon, label, sub]) => (
            <button key={m} onClick={() => setPayMethod(m)}
              style={{ padding:'12px 6px', borderRadius:10, border:`2px solid ${payMethod===m?'var(--brand)':'var(--border)'}`, background:payMethod===m?'var(--brand-light)':'var(--bg2)', cursor:'pointer', fontFamily:'Inter,sans-serif', transition:'all 0.15s', textAlign:'center' }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:payMethod===m?'var(--brand)':'var(--text)' }}>{label}</div>
              <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* UPI ID input */}
        {payMethod === 'upi' && (
          <div>
            <label className="input-label">UPI ID *</label>
            <input className="input" placeholder="yourname@upi / 9876543210@paytm" value={upiId} onChange={e => setUpiId(e.target.value)} />
            <p style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Amount will be deducted only after job completion</p>
          </div>
        )}
        {payMethod === 'card' && (
          <div style={{ display:'grid', gap:10 }}>
            <div><label className="input-label">Card Number</label><input className="input" placeholder="1234 5678 9012 3456" maxLength={19} /></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><label className="input-label">Expiry</label><input className="input" placeholder="MM/YY" maxLength={5} /></div>
              <div><label className="input-label">CVV</label><input className="input" placeholder="***" maxLength={3} type="password" /></div>
            </div>
          </div>
        )}
        {payMethod === 'cash' && (
          <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#d97706' }}>
            ⚠️ Pay cash directly to provider after job completion. Platform fee of ₹{price.fee} is waived for cash payments.
          </div>
        )}
      </div>

      {/* Trust badges */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:18 }}>
        {[['🛡️','Work Guarantee'],['✓','KYC Verified'],['🚫','Free Cancel']].map(([icon,label],i)=>(
          <div key={i} style={{ background:'rgba(22,163,74,0.05)', border:'1px solid rgba(22,163,74,0.15)', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
            <span style={{ fontSize:16 }}>{icon}</span>
            <p style={{ fontSize:10, color:'#16a34a', fontWeight:600, marginTop:3 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={onBack}>← Back</button>
        <button className="btn btn-brand" style={{ flex:2, padding:'14px', fontSize:15, fontWeight:700 }} disabled={loading} onClick={confirmBooking}>
          {loading ? (
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              Processing...
            </span>
          ) : `🔒 Confirm & Pay ₹${price.total}`}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
