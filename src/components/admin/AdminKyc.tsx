import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

export default function AdminKyc() {
  const [providers, setProviders] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [viewing,   setViewing]   = useState<any>(null) // modal

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    // Get providers who have submitted KYC
    const { data: provs } = await supabase
      .from('providers')
      .select('id, kyc_status, kyc_documents')
      .eq('kyc_status', 'submitted')

    if (!provs || provs.length === 0) { setProviders([]); setLoading(false); return }

    const ids = provs.map(p => p.id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, phone, district, created_at')
      .in('id', ids)

    const profileMap: Record<string, any> = {}
    for (const p of profiles ?? []) profileMap[p.id] = p

    const merged = provs.map(p => ({
      ...p,
      profile: profileMap[p.id] ?? {},
    }))

    // For each provider, list their files in storage
    const withDocs = await Promise.all(merged.map(async (p) => {
      const { data: files } = await supabase.storage
        .from('kyc-documents')
        .list(p.id, { limit: 20 })

      const docs = (files ?? []).map(f => {
        const { data: urlData } = supabase.storage
          .from('kyc-documents')
          .getPublicUrl(`${p.id}/${f.name}`)
        return {
          name: f.name,
          url:  urlData.publicUrl,
          label: getLabel(f.name),
        }
      })

      return { ...p, docs }
    }))

    setProviders(withDocs)
    setLoading(false)
  }

  function getLabel(filename: string) {
    const n = filename.toLowerCase()
    if (n.includes('aadhaar') || n.includes('aadhar')) return 'Aadhaar'
    if (n.includes('selfie'))      return 'Selfie'
    if (n.includes('certificate')) return 'Certificate'
    if (n.includes('bank') || n.includes('passbook')) return 'Bank Book'
    return filename.split('.')[0]
  }

  async function approve(id: string, name: string) {
    const { error } = await supabase.from('providers')
      .upsert({ id, kyc_status: 'verified' }, { onConflict: 'id' })
    if (error) { toast.error('Failed: ' + error.message); return }
    await supabase.from('notifications').insert({
      user_id: id,
      title: '✅ KYC Approved!',
      body:  'Your KYC has been approved. Go Online from your dashboard to receive bookings!',
      type:  'kyc',
    })
    setProviders(prev => prev.filter(p => p.id !== id))
    toast.success(`${name} — KYC Approved ✅`)
  }

  async function reject(id: string, name: string) {
    const { error } = await supabase.from('providers')
      .upsert({ id, kyc_status: 'rejected' }, { onConflict: 'id' })
    if (error) { toast.error('Failed: ' + error.message); return }
    await supabase.from('notifications').insert({
      user_id: id,
      title: '❌ KYC Rejected',
      body:  'Your KYC documents were rejected. Please re-upload clear, readable documents.',
      type:  'kyc',
    })
    setProviders(prev => prev.filter(p => p.id !== id))
    toast.error(`${name} — KYC Rejected`)
  }

  return (
    <div>
      <PageHeader
        title="KYC Review"
        subtitle={`${providers.length} providers awaiting verification`}
        action={<button className="btn btn-outline btn-sm" onClick={load}>↻ Refresh</button>}
      />
      <div className="page-content">

        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:'var(--text3)' }}>Loading KYC submissions...</div>
        ) : providers.length === 0 ? (
          <div className="glass" style={{ padding:48, textAlign:'center', maxWidth:480 }}>
            <p style={{ fontSize:40, marginBottom:14 }}>✅</p>
            <p style={{ fontWeight:700, fontSize:17, marginBottom:8 }}>All caught up!</p>
            <p style={{ color:'var(--text2)', fontSize:14 }}>No pending KYC submissions right now.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:760 }}>
            {providers.map((p: any) => (
              <div key={p.id} className="glass" style={{ padding:22 }}>
                {/* Provider header */}
                <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
                  <Avatar name={p.profile?.full_name} size={48} />
                  <div style={{ flex:1 }}>
                    <p style={{ fontWeight:800, fontSize:16 }}>{p.profile?.full_name ?? 'Provider'}</p>
                    <p style={{ fontSize:12, color:'var(--text2)', marginTop:3 }}>
                      📍 {p.profile?.district ?? '—'} &nbsp;·&nbsp;
                      📞 {p.profile?.phone ?? '—'} &nbsp;·&nbsp;
                      Joined {p.profile?.created_at ? new Date(p.profile.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </p>
                    <p style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>ID: {p.id.slice(0,18)}...</p>
                  </div>
                  <span className="badge badge-blue">Documents submitted</span>
                </div>

                {/* Document thumbnails */}
                <div style={{ marginBottom:18 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:10 }}>Documents:</p>
                  {p.docs?.length === 0 ? (
                    <div style={{ background:'rgba(220,38,38,0.05)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#dc2626' }}>
                      ⚠️ No files found in storage for this provider.
                      <p style={{ fontSize:11, marginTop:4, color:'var(--text3)' }}>Provider may not have uploaded files yet, or bucket was recently recreated.</p>
                    </div>
                  ) : (
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {p.docs.map((doc: any, i: number) => (
                        <div key={i}
                          onClick={() => setViewing(doc)}
                          style={{ cursor:'pointer', border:'1.5px solid var(--border)', borderRadius:12, overflow:'hidden', width:130, transition:'all 0.15s' }}
                          onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--brand)'; el.style.transform='scale(1.02)' }}
                          onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--border)'; el.style.transform='' }}>
                          {/* Thumbnail */}
                          <div style={{ height:90, background:'var(--bg2)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', position:'relative' }}>
                            {doc.url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                              <img src={doc.url} alt={doc.label}
                                style={{ width:'100%', height:'100%', objectFit:'cover' }}
                                onError={e => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('hidden') }}
                              />
                            ) : null}
                            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>📄</div>
                          </div>
                          {/* Label */}
                          <div style={{ padding:'8px 10px', background:'var(--card)' }}>
                            <p style={{ fontSize:11, fontWeight:700, color:'var(--text)' }}>✓ {doc.label}</p>
                            <p style={{ fontSize:9, color:'var(--text3)', marginTop:2 }}>Click to view</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn btn-success" style={{ flex:1 }} onClick={() => approve(p.id, p.profile?.full_name ?? 'Provider')}>
                    ✓ Approve KYC
                  </button>
                  <button className="btn btn-danger" style={{ flex:1 }} onClick={() => reject(p.id, p.profile?.full_name ?? 'Provider')}>
                    ✕ Reject KYC
                  </button>
                  <a href={`/admin/providers`} className="btn btn-outline" style={{ textDecoration:'none' }}>View Profile</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document viewer modal */}
      {viewing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setViewing(null)}>
          <div style={{ background:'var(--card)', borderRadius:20, overflow:'hidden', maxWidth:640, width:'100%', maxHeight:'90vh', display:'flex', flexDirection:'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontWeight:700, fontSize:15 }}>📄 {viewing.label}</p>
              <div style={{ display:'flex', gap:10 }}>
                <a href={viewing.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">↗ Open Full</a>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewing(null)}>✕ Close</button>
              </div>
            </div>
            <div style={{ flex:1, overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'var(--bg2)', minHeight:300 }}>
              {viewing.url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                <img src={viewing.url} alt={viewing.label} style={{ maxWidth:'100%', maxHeight:'70vh', borderRadius:10, objectFit:'contain' }}
                  onError={() => toast.error('Could not load image — check if bucket is public')} />
              ) : (
                <iframe src={viewing.url} style={{ width:'100%', height:'70vh', border:'none', borderRadius:10 }} title={viewing.label} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
