import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

interface Props {
  svc: any; selectedProv: any; price: any
  address: string; city: string; district: string
  notes: string; setNotes: (v:string) => void
  hours: number; svcType: string; rate: number
  onBack: () => void
}

function loadRazorpay(): Promise<boolean> {
  return new Promise(resolve => {
    if ((window as any).Razorpay) { resolve(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => resolve(true)
    s.onerror = () => resolve(false)
    document.body.appendChild(s)
  })
}

export default function BookingConfirmPage({
  svc, selectedProv, price, address, city, district,
  notes, setNotes, hours, svcType, rate, onBack
}: Props) {
  const { profile } = useAuthStore()
  const nav = useNavigate()
  const [payMethod,  setPayMethod]  = useState('upi')
  const [loading,    setLoading]    = useState(false)
  const [done,       setDone]       = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [bookingOtp, setBookingOtp] = useState('')

  async function createBookingRecord() {
    const { data: cat } = await supabase
      .from('service_categories').select('id').eq('slug', svc.id).maybeSingle()

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_id:    profile!.id,
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

    // Notify provider
    if (selectedProv?.id) {
      await supabase.from('notifications').insert({
        user_id: selectedProv.id,
        title:   '🔔 New Job Request!',
        body:    `${profile!.full_name} needs ${svc.name} in ${district}. ₹${price.total}`,
        type:    'booking',
        data:    { booking_id: booking.id },
      }).then(() => {})
    }
    return booking
  }

  async function handleRazorpay() {
    setLoading(true)
    try {
      const RZPKEY = import.meta.env.VITE_RAZORPAY_KEY_ID
      if (!RZPKEY) {
        // Demo mode — no key configured, create booking directly
        toast('Demo mode: Payment gateway not configured', { icon: 'ℹ️' })
        const booking = await createBookingRecord()
        setBookingRef(booking.booking_ref)
        setBookingOtp(booking.start_otp ?? '----')
        setDone(true)
        setLoading(false)
        return
      }

      const loaded = await loadRazorpay()
      if (!loaded) { toast.error('Payment service unavailable'); setLoading(false); return }

      const booking = await createBookingRecord()

      const options = {
        key:         RZPKEY,
        amount:      Math.round(price.total * 100),
        currency:    'INR',
        name:        'POWERSTAR',
        description: `${svc.name} - ${district}`,
        image:       'https://powerstar-platform-4sap.vercel.app/icon.png',
        prefill:     { name: profile!.full_name, contact: profile!.phone ?? '' },
        notes:       { booking_id: booking.id },
        theme:       { color: '#f97316' },
        config: {
          display: {
            blocks: {
              upi:    { name: 'Pay via UPI',  instruments: [{ method: 'upi' }] },
              card:   { name: 'Pay via Card', instruments: [{ method: 'card' }] },
              wallet: { name: 'Wallets',      instruments: [{ method: 'wallet' }] },
            },
            sequence:  payMethod === 'upi' ? ['block.upi'] : payMethod === 'card' ? ['block.card'] : ['block.wallet'],
            preferences: { show_default_blocks: false },
          }
        },
        handler: async (response: any) => {
          await supabase.from('bookings').update({
            customer_notes: (notes ? notes + ' | ' : '') + `rzp:${response.razorpay_payment_id}`,
          }).eq('id', booking.id)
          setBookingRef(booking.booking_ref)
          setBookingOtp(booking.start_otp ?? '----')
          setDone(true)
          setLoading(false)
          toast.success('Payment successful! Booking confirmed 🎉')
        },
        modal: {
          ondismiss: async () => {
            await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', booking.id)
            toast.error('Payment cancelled')
            setLoading(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (err: any) {
      toast.error(err?.message || 'Payment failed')
      setLoading(false)
    }
  }

  async function handleCash() {
    setLoading(true)
    try {
      const booking = await createBookingRecord()
      setBookingRef(booking.booking_ref)
      setBookingOtp(booking.start_otp ?? '----')
      setDone(true)
      toast.success('Booking confirmed! Pay cash to provider on arrival.')
    } catch (err: any) {
      toast.error(err?.message || 'Booking failed')
    } finally {
      setLoading(false)
    }
  }

  // ── SUCCESS SCREEN ──────────────────────────────────────
  if (done) return (
    <div style={{ textAlign:'center', padding:'10px' }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(22,163,74,0.1)', border:'3px solid #16a34a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 16px' }}>✅</div>
      <h2 style={{ fontWeight:800, fontSize:22, fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:6 }}>Booking Confirmed!</h2>
      <p style={{ color:'var(--text2)', fontSize:13, marginBottom:20 }}>Provider has been notified and will arrive shortly.</p>

      {/* OTP */}
      <div style={{ background:'rgba(249,115,22,0.08)', border:'2px solid rgba(249,115,22,0.3)', borderRadius:16, padding:20, marginBottom:16 }}>
        <p style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Your Start OTP</p>
        <p style={{ fontSize:48, fontWeight:900, letterSpacing:10, color:'var(--brand)', fontFamily:'monospace' }}>{bookingOtp}</p>
        <p style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>🔐 Share only when provider arrives. Never share over call or chat.</p>
      </div>

      {/* Summary */}
      <div style={{ background:'var(--bg2)', borderRadius:14, padding:16, marginBottom:18, textAlign:'left' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            ['Booking ID', bookingRef],
            ['Service',   svc.name],
            ['Provider',  selectedProv?.profile?.full_name ?? '—'],
            ['Location',  `${city || district}, ${district}`],
            ['Amount',    '₹'+price.total],
            ['Payment',   payMethod === 'cash' ? 'Cash on Delivery' : payMethod.toUpperCase()],
          ].map(([k,v],i) => (
            <div key={i}>
              <p style={{ fontSize:11, color:'var(--text3)', marginBottom:3 }}>{k}</p>
              <p style={{ fontSize:13, fontWeight:600 }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={() => nav('/dashboard/bookings')}>My Bookings</button>
        <button className="btn btn-brand"  style={{ flex:1 }} onClick={() => nav('/dashboard/track')}>📍 Track Live →</button>
      </div>
    </div>
  )

  // ── PAYMENT SCREEN ──────────────────────────────────────
  return (
    <div>
      <h3 style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>Confirm & Pay</h3>

      {/* Provider summary */}
      <div style={{ display:'flex', gap:12, alignItems:'center', background:'var(--bg2)', borderRadius:12, padding:'12px 16px', marginBottom:12 }}>
        <Avatar name={selectedProv?.profile?.full_name ?? 'P'} size={42} />
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:700, fontSize:14 }}>{selectedProv?.profile?.full_name}</p>
          <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
            {svc.icon} {svc.name} · ★{selectedProv?.rating > 0 ? Number(selectedProv.rating).toFixed(1) : 'New'} · ✓ Verified
          </p>
        </div>
        <span className="badge badge-green">Online</span>
      </div>

      {/* Location */}
      <div style={{ background:'var(--bg2)', borderRadius:10, padding:'10px 14px', marginBottom:12, fontSize:13, color:'var(--text2)', display:'flex', gap:8 }}>
        <span>📍</span><span>{address}, {city || district}, {district}</span>
      </div>

      {/* Price breakdown */}
      <div style={{ background:'var(--bg2)', borderRadius:14, overflow:'hidden', marginBottom:12 }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>
          <p style={{ fontWeight:700, fontSize:13 }}>Price Breakdown</p>
        </div>
        <div style={{ padding:'14px 16px' }}>
          {[
            [`${svc.name} (${svcType==='manpower'?hours+' hrs × ₹'+rate:'1 trip'})`, price.base],
            ['Platform fee (5%)', price.fee],
            ['GST (18%)',         price.gst],
          ].map(([k,v],i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--text2)', marginBottom:7 }}>
              <span>{k}</span><span>₹{v}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:18, borderTop:'1px solid var(--border)', paddingTop:10, marginTop:4 }}>
            <span>Total</span><span style={{ color:'var(--brand)' }}>₹{price.total}</span>
          </div>
          <p style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>💡 Held securely · Released after job completion via OTP</p>
        </div>
      </div>

      {/* Special instructions */}
      <div style={{ marginBottom:12 }}>
        <label className="input-label">Special instructions (optional)</label>
        <textarea className="input" style={{ minHeight:56, resize:'none' }}
          placeholder="Enter from side gate, call on arrival..."
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      {/* Payment method */}
      <div style={{ marginBottom:16 }}>
        <p style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Payment Method</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:10 }}>
          {[
            ['upi',    '📱','UPI',   'PhonePe, GPay'],
            ['card',   '💳','Card',  'Debit/Credit'],
            ['wallet', '👛','Wallet','Paytm etc'],
            ['cash',   '💵','Cash',  'Pay on arrival'],
          ].map(([m,icon,label,sub]) => (
            <button key={m} onClick={() => setPayMethod(m)}
              style={{ padding:'11px 4px', borderRadius:10, border:`2px solid ${payMethod===m?'var(--brand)':'var(--border)'}`, background:payMethod===m?'var(--brand-light)':'var(--bg2)', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
              <div style={{ fontSize:20, marginBottom:3 }}>{icon}</div>
              <div style={{ fontSize:11, fontWeight:700, color:payMethod===m?'var(--brand)':'var(--text)' }}>{label}</div>
              <div style={{ fontSize:9, color:'var(--text3)', marginTop:1 }}>{sub}</div>
            </button>
          ))}
        </div>

        {/* Info banner for online payments */}
        {payMethod !== 'cash' && (
          <div style={{ background:'rgba(37,99,235,0.05)', border:'1px solid rgba(37,99,235,0.15)', borderRadius:10, padding:'10px 14px', display:'flex', gap:8, alignItems:'center', fontSize:12 }}>
            <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
            <div>
              <p style={{ fontWeight:700, color:'#2563eb', marginBottom:1 }}>Secure payment via Razorpay</p>
              <p style={{ color:'var(--text2)' }}>
                {payMethod==='upi' ? 'Works with PhonePe, Google Pay, Paytm, BHIM & all UPI apps'
                  : payMethod==='card' ? 'Visa, Mastercard, RuPay — 256-bit encrypted'
                  : 'Amazon Pay, Paytm, PhonePe wallet & more'}
              </p>
            </div>
          </div>
        )}
        {payMethod === 'cash' && (
          <div style={{ background:'rgba(217,119,6,0.06)', border:'1px solid rgba(217,119,6,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12, color:'#d97706' }}>
            ⚠️ Pay ₹{price.total} directly to provider after job completion.
          </div>
        )}
      </div>

      {/* Trust */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:16 }}>
        {[['🛡️','Work Guarantee'],['🔒','Secure Payment'],['❌','Free Cancel']].map(([icon,label],i)=>(
          <div key={i} style={{ background:'rgba(22,163,74,0.05)', border:'1px solid rgba(22,163,74,0.15)', borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
            <span style={{ fontSize:15 }}>{icon}</span>
            <p style={{ fontSize:10, color:'#16a34a', fontWeight:600, marginTop:2 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={onBack}>← Back</button>
        <button className="btn btn-brand" style={{ flex:2, padding:'14px', fontSize:15, fontWeight:700 }}
          disabled={loading}
          onClick={payMethod === 'cash' ? handleCash : handleRazorpay}>
          {loading ? (
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <div style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
              Processing...
            </span>
          ) : payMethod === 'cash'
            ? `📋 Confirm Booking · ₹${price.total}`
            : `🔒 Pay ₹${price.total} via ${payMethod==='upi'?'UPI':payMethod==='card'?'Card':'Wallet'}`}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
