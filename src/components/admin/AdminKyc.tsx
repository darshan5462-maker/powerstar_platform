import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { updateKycStatus } from '@/services/bookingService'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function AdminKyc() {
  const [queue,   setQueue]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadKyc() }, [])

  async function loadKyc() {
    setLoading(true)
    // Get providers with submitted/pending KYC, joined with their profile
    const { data, error } = await supabase
      .from('providers')
      .select(`
        *,
        profile:profiles!inner(full_name, phone, district, city, created_at)
      `)
      .in('kyc_status', ['pending', 'submitted'])
      .order('updated_at', { ascending: false })
    if (error) console.error(error)
    setQueue(data ?? [])
    setLoading(false)
  }

  async function approve(id: string, name: string) {
    try {
      await updateKycStatus(id, 'verified')
      setQueue(prev => prev.filter(p => p.id !== id))
      toast.success(`${name} — KYC Approved ✅`)
    } catch (err: any) { toast.error(err.message) }
  }

  async function reject(id: string, name: string) {
    try {
      await updateKycStatus(id, 'rejected')
      setQueue(prev => prev.filter(p => p.id !== id))
      toast.error(`${name} — KYC Rejected`)
    } catch (err: any) { toast.error(err.message) }
  }

  function DocPill({ ok, url, label }: { ok: boolean; url?: string; label: string }) {
    return (
      <a
        href={url || '#'} target="_blank" rel="noreferrer"
        style={{ textDecoration:'none' }}
        onClick={e => { if (!url) e.preventDefault() }}
      >
        <span style={{
          fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:6,
          background: ok ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
          color: ok ? '#16a34a' : '#dc2626',
          border: `1px solid ${ok ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
          cursor: url ? 'pointer' : 'default',
          display: 'inline-block',
        }}>
          {ok ? '✓' : '✗'} {label} {ok && url ? '↗' : ''}
        </span>
      </a>
    )
  }

  return (
    <div>
      <PageHeader
        title="KYC Review"
        subtitle={`${queue.length} providers awaiting verification`}
        action={
          <button className="btn btn-outline btn-sm" onClick={loadKyc}>↻ Refresh</button>
        }
      />
      <div className="page-content">
        {loading ? (
          <div style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading KYC queue...</div>
        ) : queue.length === 0 ? (
          <div className="glass" style={{ padding:48, textAlign:'center' }}>
            <p style={{ fontSize:40, marginBottom:12 }}>✅</p>
            <p style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>All caught up!</p>
            <p style={{ color:'var(--text2)', fontSize:13 }}>No pending KYC reviews.</p>
            <p style={{ color:'var(--text3)', fontSize:12, marginTop:8 }}>
              When providers submit documents from their KYC page, they appear here automatically.
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {queue.map((p: any) => {
              const name   = p.profile?.full_name ?? 'Provider'
              const allOk  = p.aadhaar_url && p.selfie_url && p.certificate_url && p.bank_passbook_url
              return (
                <div key={p.id} className="glass" style={{ padding:22 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:14 }}>
                    <Avatar name={name} size={46} />
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                        <p style={{ fontWeight:800, fontSize:15 }}>{name}</p>
                        <span style={{
                          fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:6,
                          background: p.kyc_status==='submitted' ? 'rgba(37,99,235,0.1)' : 'rgba(217,119,6,0.1)',
                          color:      p.kyc_status==='submitted' ? '#2563eb' : '#d97706',
                          border:`1px solid ${p.kyc_status==='submitted'?'rgba(37,99,235,0.3)':'rgba(217,119,6,0.3)'}`,
                        }}>
                          {p.kyc_status === 'submitted' ? '📄 Documents submitted' : '⏳ Pending'}
                        </span>
                        {!allOk && <span className="badge badge-red">Incomplete docs</span>}
                      </div>
                      <p style={{ fontSize:12, color:'var(--text2)' }}>
                        📍 {p.profile?.district ?? '—'} {p.profile?.city ? `· ${p.profile.city}` : ''} ·
                        Joined {new Date(p.profile?.created_at ?? p.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'})}
                      </p>
                      <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                        📞 {p.profile?.phone ?? 'No phone'} · ID: {p.id.slice(0,12)}...
                      </p>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <button className="btn btn-success" style={{ padding:'8px 18px' }} onClick={() => approve(p.id, name)}>✓ Approve</button>
                      <button className="btn btn-danger"  style={{ padding:'8px 18px' }} onClick={() => reject(p.id,  name)}>✗ Reject</button>
                    </div>
                  </div>

                  {/* Document links */}
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap', padding:'12px 14px', background:'var(--bg2)', borderRadius:10 }}>
                    <span style={{ fontSize:11, color:'var(--text3)', marginRight:4 }}>Documents:</span>
                    <DocPill ok={!!p.aadhaar_url}       url={p.aadhaar_url}       label="Aadhaar" />
                    <DocPill ok={!!p.selfie_url}        url={p.selfie_url}        label="Selfie" />
                    <DocPill ok={!!p.certificate_url}   url={p.certificate_url}   label="Certificate" />
                    <DocPill ok={!!p.bank_passbook_url} url={p.bank_passbook_url} label="Bank Book" />
                  </div>

                  {!allOk && (
                    <p style={{ fontSize:11, color:'#dc2626', marginTop:10 }}>
                      ⚠️ Missing: {[
                        !p.aadhaar_url       && 'Aadhaar',
                        !p.selfie_url        && 'Selfie',
                        !p.certificate_url   && 'Certificate',
                        !p.bank_passbook_url && 'Bank Book',
                      ].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
