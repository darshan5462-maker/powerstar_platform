import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { updateProfile } from '@/services/authService'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { DISTRICTS, getCities } from '@/data/karnataka'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const { profile, setProfile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    district:  profile?.district  || 'Bengaluru Urban',
    city:      profile?.city      || '',
    address:   '',
  })

  const districtObj = DISTRICTS.find(d => d.name === form.district) || DISTRICTS[0]
  const cities = getCities(districtObj.id)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function save() {
    if (!profile?.id) return
    setSaving(true)
    try {
      const updated = await updateProfile(profile.id, {
        full_name: form.full_name,
        phone:     form.phone,
        district:  form.district,
        city:      form.city,
        address:   form.address,
      })
      setProfile({ ...profile, ...updated })
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account details" />
      <div className="page-content">
        <div style={{ maxWidth: 560 }}>

          {/* Avatar header */}
          <div className="glass" style={{ padding:22, marginBottom:16, display:'flex', alignItems:'center', gap:16 }}>
            <Avatar name={profile?.full_name} size={60} />
            <div>
              <p style={{ fontWeight:800, fontSize:18, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{profile?.full_name}</p>
              <span className="badge badge-orange" style={{ marginTop:4, display:'inline-block' }}>Customer</span>
              <p style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>Member since {new Date().toLocaleDateString('en-IN', { month:'long', year:'numeric' })}</p>
            </div>
          </div>

          <div className="glass" style={{ padding:22 }}>
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
                <label className="input-label">District</label>
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
            <div style={{ marginBottom:20 }}>
              <label className="input-label">Full Address</label>
              <input className="input" value={form.address} onChange={set('address')} placeholder="House no, street, landmark..." />
            </div>
            <button className="btn btn-brand" style={{ width:'100%' }} onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
