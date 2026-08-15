import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { updateProfile } from '@/services/authService'
import PageHeader from '@/components/layout/PageHeader'
import Avatar from '@/components/ui/Avatar'
import { DISTRICTS } from '@/data/karnataka'
import toast from 'react-hot-toast'

export default function CustomerProfile() {
  const { profile, setProfile } = useAuthStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    district:  profile?.district  || 'Bengaluru Urban',
    city:      profile?.city      || '',
  })
  const set = (k:string) => (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f=>({...f,[k]:e.target.value}))

  async function save() {
    if (!profile) return
    setSaving(true)
    try {
      const updated = await updateProfile(profile.id, form)
      setProfile({ ...profile, ...updated })
      toast.success('Profile updated!')
    } catch { toast.error('Update failed') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your account details" />
      <div className="page-content">
        <div className="glass" style={{maxWidth:560,padding:28}}>
          <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:28,paddingBottom:20,borderBottom:'1px solid var(--border)'}}>
            <Avatar name={profile?.full_name} size={60} />
            <div>
              <h2 style={{fontSize:20,fontWeight:800,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{profile?.full_name}</h2>
              <span className="badge badge-orange" style={{marginTop:6}}>Customer</span>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14}}>
            <div><label className="input-label">Full Name</label><input className="input" value={form.full_name} onChange={set('full_name')} /></div>
            <div><label className="input-label">Phone</label><input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" /></div>
            <div>
              <label className="input-label">District</label>
              <select className="input" value={form.district} onChange={set('district')}>
                {DISTRICTS.map(d=><option key={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label className="input-label">City / Area</label><input className="input" value={form.city} onChange={set('city')} placeholder="e.g. Koramangala" /></div>
          </div>
          <div style={{marginBottom:20}}>
            <label className="input-label">Email</label>
            <input className="input" value={profile?.id?'customer@demo.com':''} disabled style={{opacity:0.6}} />
          </div>
          <button className="btn btn-brand" onClick={save} disabled={saving}>{saving?'Saving…':'Save Changes'}</button>
        </div>
      </div>
    </div>
  )
}
