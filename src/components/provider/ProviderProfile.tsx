import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { updateProfile } from '@/services/authService'
import { upsertProvider, getProviderProfile } from '@/services/bookingService'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { DISTRICTS, getCities } from '@/data/karnataka'
import toast from 'react-hot-toast'

export default function ProviderProfile() {
  const { profile, setProfile } = useAuthStore()
  const [saving, setSaving]   = useState(false)
  const [provData, setProvData] = useState<any>(null)

  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    district:  profile?.district  || 'Bengaluru Urban',
    city:      profile?.city      || '',
  })
  const [provForm, setProvForm] = useState({
    category_id:      '',
    experience_years: 3,
    hourly_rate:      290,
    bio:              '',
  })

  const districtObj = DISTRICTS.find(d => d.name === form.district) || DISTRICTS[0]
  const cities = getCities(districtObj.id)

  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    // Load categories
    supabase.from('service_categories').select('id,name,icon,type').order('sort_order')
      .then(({ data }) => setCategories(data ?? []))

    // Load existing provider data
    if (profile?.id) {
      getProviderProfile(profile.id).then(d => {
        if (d) {
          setProvData(d)
          setProvForm({
            category_id:      d.category_id ?? '',
            experience_years: d.experience_years ?? 3,
            hourly_rate:      d.hourly_rate ?? 290,
            bio:              d.bio ?? '',
          })
        }
      })
    }
  }, [profile?.id])

  const set  = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))
  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setProvForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!profile?.id) return
    setSaving(true)
    try {
      const updated = await updateProfile(profile.id, form)
      setProfile({ ...profile, ...updated })

      if (provForm.category_id) {
        await upsertProvider(profile.id, {
          category_id:      provForm.category_id,
          experience_years: Number(provForm.experience_years),
          hourly_rate:      Number(provForm.hourly_rate),
          bio:              provForm.bio || undefined,
        })
      }
      toast.success('Profile saved!')
    } catch (err: any) {
      toast.error(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Your provider account details" />
      <div className="page-content">
        <div style={{ maxWidth: 580 }}>

          {/* Avatar + name */}
          <div className="glass" style={{ padding:22, marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
            <Avatar name={profile?.full_name} size={60} color="#16a34a" />
            <div>
              <p style={{ fontWeight:800, fontSize:18 }}>{profile?.full_name}</p>
              <span className="badge badge-green" style={{ marginTop:4, display:'inline-block' }}>Provider</span>
              {provData?.kyc_status === 'verified' && <span className="badge badge-blue" style={{ marginLeft:6 }}>✓ KYC Verified</span>}
            </div>
          </div>

          {/* Personal info */}
          <div className="glass" style={{ padding:22, marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:14, marginBottom:16, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>Personal Information</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div>
                <label className="input-label">Full Name</label>
                <input className="input" value={form.full_name} onChange={set('full_name')} />
              </div>
              <div>
                <label className="input-label">Phone</label>
                <input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="input-label">District (Service Area)</label>
                <select className="input" value={form.district} onChange={e => { set('district')(e); setForm(f => ({ ...f, city:'' })) }}>
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
          </div>

          {/* Professional info */}
          <div className="glass" style={{ padding:22, marginBottom:16 }}>
            <h3 style={{ fontWeight:700, fontSize:14, marginBottom:16, paddingBottom:10, borderBottom:'1px solid var(--border)' }}>Professional Details</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label className="input-label">Primary Service / Skill</label>
                <select className="input" value={provForm.category_id} onChange={setP('category_id')}>
                  <option value="">Select your service</option>
                  {categories.filter(c => c.type === 'manpower' || c.type === 'vehicle').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">Experience (years)</label>
                <select className="input" value={provForm.experience_years} onChange={setP('experience_years')}>
                  {[1,2,3,4,5,6,7,8,9,10,15,20].map(y => <option key={y} value={y}>{y} {y===1?'year':'years'}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Hourly Rate (₹)</label>
                <input className="input" type="number" min={100} max={5000} value={provForm.hourly_rate} onChange={setP('hourly_rate')} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label className="input-label">Bio (optional)</label>
                <textarea
                  className="input"
                  style={{ minHeight:80, resize:'vertical' }}
                  placeholder="Briefly describe your experience, specialties..."
                  value={provForm.bio}
                  onChange={setP('bio') as any}
                />
              </div>
            </div>
          </div>

          <button className="btn btn-brand" style={{ width:'100%' }} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
