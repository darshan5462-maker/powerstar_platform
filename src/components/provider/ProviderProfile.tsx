import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { updateProfile } from '@/services/authService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { DISTRICTS, getCities } from '@/data/karnataka'
import toast from 'react-hot-toast'

export default function ProviderProfile() {
  const { profile, setProfile } = useAuthStore()
  const [saving,      setSaving]      = useState(false)
  const [categories,  setCategories]  = useState<any[]>([])
  const [myServices,  setMyServices]  = useState<any[]>([])
  const [loadError,   setLoadError]   = useState<string | null>(null)
  const [addingCat,   setAddingCat]   = useState('')
  const [addingRate,  setAddingRate]  = useState('290')
  const [addingExp,   setAddingExp]   = useState('3')
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    district:  profile?.district  || 'Bengaluru Urban',
    city:      profile?.city      || '',
  })

  const districtObj = DISTRICTS.find(d => d.name === form.district) || DISTRICTS[0]
  const cities = getCities(districtObj.id)
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => { loadData() }, [profile?.id]) // eslint-disable-line

  async function loadData() {
    if (!profile?.id) return
    setLoadError(null)
    try {
      const [cats, svc] = await Promise.all([
        supabase.from('service_categories')
          .select('id,name,icon,type,base_price,price_unit')
          .in('type', ['manpower','vehicle'])
          .order('sort_order'),
        supabase.from('provider_services')
          .select('*, category:service_categories(name,icon,price_unit)')
          .eq('provider_id', profile.id),
      ])
      if (cats.error) throw cats.error
      setCategories(cats.data ?? [])
      // Keep compatibility with an older database until the additive migration is applied.
      if (svc.error && svc.error.code === '42P01') {
        const { data: provRow, error: providerError } = await supabase
          .from('providers').select('category_id, hourly_rate, experience_years, category:service_categories(name,icon,price_unit)')
          .eq('id', profile.id).maybeSingle()
        if (providerError) throw providerError
        setMyServices(provRow?.category_id ? [{ id: 'legacy', category_id: provRow.category_id, hourly_rate: provRow.hourly_rate, experience_years: provRow.experience_years, category: provRow.category }] : [])
      } else {
        if (svc.error) throw svc.error
        setMyServices(svc.data ?? [])
      }
    } catch {
      setLoadError('Profile services could not be loaded right now.')
      setCategories([])
      setMyServices([])
    }
  }

  async function addService() {
    if (!profile?.id || !addingCat) { toast.error('Select a service'); return }
    if (myServices.find(s => s.category_id === addingCat)) { toast.error('Service already added'); return }
    const rate = Number(addingRate)
    const experience = Number(addingExp)
    if (!Number.isFinite(rate) || rate < 50 || !Number.isFinite(experience) || experience < 0) {
      toast.error('Enter a valid rate and experience')
      return
    }

    // Try provider_services table first
    const { error } = await supabase.from('provider_services').insert({
      provider_id: profile.id, category_id: addingCat,
      hourly_rate: rate, experience_years: experience,
    })
    if (error && error.code === '42P01') {
      // Legacy compatibility only: fall back when the additive table is absent.
      const { error: providerError } = await supabase.from('providers').upsert({
        id: profile.id, category_id: addingCat,
        hourly_rate: rate, experience_years: experience,
      }, { onConflict: 'id' })
      if (providerError) throw providerError
      toast.success('Service updated!')
    } else if (error) {
      throw error
    } else {
      // Also update primary category if first service.
      if (myServices.length === 0) {
        const { error: providerError } = await supabase.from('providers').upsert({
          id: profile.id, category_id: addingCat, hourly_rate: rate,
        }, { onConflict: 'id' })
        if (providerError) throw providerError
      }
      toast.success('Service added!')
    }
    setAddingCat('')
    void loadData()
  }

  async function removeService(id: string) {
    if (id === 'legacy') { toast.error("Can't remove primary service — update it instead"); return }
    if (!window.confirm('Remove this service from your provider profile?')) return
    const { error } = await supabase.from('provider_services').delete().eq('id', id).eq('provider_id', profile?.id)
    if (error) { toast.error(error.message || 'Could not remove service'); return }
    toast.success('Service removed')
    void loadData()
  }

  async function saveProfile() {
    if (!profile?.id) return
    setSaving(true)
    try {
      const updated = await updateProfile(profile.id, form)
      setProfile({ ...profile, ...updated })
      // Ensure the provider row exists without overwriting KYC or online state.
      const { error: providerError } = await supabase.from('providers').upsert({ id: profile.id }, { onConflict: 'id' })
      if (providerError) throw providerError
      toast.success('Profile saved!')
    } catch (err: any) { toast.error(err?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const usedCatIds = new Set(myServices.map(s => s.category_id))
  const available  = categories.filter(c => !usedCatIds.has(c.id))

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your profile and services" />
      <div className="page-content">
        <div style={{ maxWidth: 600 }}>

          {/* Avatar */}
          <div className="glass" style={{ padding:20, marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
            <Avatar name={profile?.full_name} size={60} color="#16a34a" />
            <div>
              <p style={{ fontWeight:800, fontSize:18 }}>{profile?.full_name}</p>
              <span className="badge badge-green" style={{ marginTop:4, display:'inline-block' }}>Provider</span>
            </div>
          </div>

          {/* Personal info */}
          <div className="glass" style={{ padding:22, marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:14, marginBottom:16, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>Personal Information</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div><label className="input-label">Full Name</label><input className="input" value={form.full_name} onChange={set('full_name')} /></div>
              <div><label className="input-label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></div>
              <div>
                <label className="input-label">District (Service Area)</label>
                <select className="input" value={form.district} onChange={e => { set('district')(e); setForm(f => ({...f, city:''})) }}>
                  {DISTRICTS.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">City / Area</label>
                <select className="input" value={form.city} onChange={set('city')}>
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-brand" style={{ width:'100%' }} onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {loadError && <div className="glass" role="alert" style={{ padding:14, marginBottom:16, color:'#b91c1c', background:'rgba(220,38,38,0.05)' }}>{loadError} <button className="btn btn-outline btn-sm" style={{ marginLeft:8 }} onClick={() => void loadData()}>Try again</button></div>}

          {/* My Services — multi-service management */}
          <div className="glass" style={{ padding:22, marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:14, marginBottom:16, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>
              My Services <span style={{ fontSize:12, fontWeight:400, color:'var(--text3)' }}>({myServices.length} active)</span>
            </h3>

            {myServices.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text3)', fontSize:13, marginBottom:16 }}>
                No services yet. Add your first service below to start receiving bookings.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:18 }}>
                {myServices.map((s:any) => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:24, flexShrink:0 }}>{s.category?.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:700, fontSize:13 }}>{s.category?.name}</p>
                      <p style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>
                        ₹{s.hourly_rate}{s.category?.price_unit ?? '/hr'} · {s.experience_years} yr{s.experience_years > 1 ? 's' : ''} exp
                      </p>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
                      <span className="badge badge-green" style={{ fontSize:10 }}>Active</span>
                      {s.id !== 'legacy' && (
                        <button className="btn btn-danger btn-sm" onClick={() => removeService(s.id)}>✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new service */}
            {available.length > 0 && (
              <div style={{ background:'var(--bg)', borderRadius:12, padding:16, border:'1.5px dashed var(--border)' }}>
                <p style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>+ Add Another Service</p>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:10, marginBottom:10 }}>
                  <div>
                    <label className="input-label">Service</label>
                    <select className="input" value={addingCat} onChange={e => setAddingCat(e.target.value)}>
                      <option value="">Select...</option>
                      {available.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Rate (₹/hr)</label>
                    <input className="input" type="number" min={50} value={addingRate} onChange={e => setAddingRate(e.target.value)} />
                  </div>
                  <div>
                    <label className="input-label">Exp (yrs)</label>
                    <select className="input" value={addingExp} onChange={e => setAddingExp(e.target.value)}>
                      {[1,2,3,5,8,10,15,20].map(y => <option key={y} value={y}>{y}yr</option>)}
                    </select>
                  </div>
                </div>
                <button className="btn btn-brand" style={{ width:'100%' }} onClick={addService} disabled={!addingCat}>
                  + Add Service
                </button>
              </div>
            )}
            {available.length === 0 && myServices.length > 0 && (
              <p style={{ fontSize:12, color:'var(--text3)', textAlign:'center', marginTop:8 }}>All available services have been added.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
