import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string,string>>({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    supabase.from('platform_settings').select('*').then(({ data }) => {
      const map: Record<string,string> = {}
      data?.forEach(r => { map[r.key] = r.value })
      setSettings(map)
      setLoading(false)
    })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setSettings(s => ({ ...s, [k]: e.target.value }))

  async function save() {
    setSaving(true)
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }))
      await supabase.from('platform_settings').upsert(updates, { onConflict: 'key' })
      toast.success('Settings saved successfully!')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div>
      <PageHeader title="Platform Settings" />
      <div className="page-content" style={{ textAlign:'center', paddingTop:48, color:'var(--text3)' }}>Loading settings...</div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Platform Settings" subtitle="Global configuration for POWERSTAR" />
      <div className="page-content" style={{ maxWidth:640 }}>
        <div className="glass" style={{ padding:24, marginBottom:16 }}>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>General</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><label className="input-label">Support Phone</label><input className="input" value={settings['support_phone']||''} onChange={set('support_phone')} /></div>
            <div><label className="input-label">Support Email</label><input className="input" value={settings['support_email']||''} onChange={set('support_email')} /></div>
          </div>
        </div>

        <div className="glass" style={{ padding:24, marginBottom:16 }}>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>Financial</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            <div><label className="input-label">Platform Fee (%)</label><input className="input" type="number" value={settings['platform_fee_percent']||'5'} onChange={set('platform_fee_percent')} /></div>
            <div><label className="input-label">GST (%)</label><input className="input" type="number" value={settings['gst_percent']||'18'} onChange={set('gst_percent')} /></div>
            <div><label className="input-label">Settlement (hours)</label><input className="input" type="number" value={settings['settlement_hours']||'24'} onChange={set('settlement_hours')} /></div>
          </div>
          <div style={{ marginTop:14 }}>
            <label className="input-label">Min Booking Amount (₹)</label>
            <input className="input" style={{ maxWidth:160 }} type="number" value={settings['min_booking_amount']||'100'} onChange={set('min_booking_amount')} />
          </div>
        </div>

        <div className="glass" style={{ padding:24, marginBottom:20 }}>
          <h3 style={{ fontWeight:700, fontSize:14, marginBottom:18, paddingBottom:12, borderBottom:'1px solid var(--border)' }}>Notifications</h3>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label className="input-label">SMS Provider</label>
              <select className="input">
                <option>MSG91</option><option>Twilio</option><option>Exotel</option>
              </select>
            </div>
            <div>
              <label className="input-label">Push Notifications</label>
              <select className="input">
                <option>Firebase FCM</option><option>OneSignal</option>
              </select>
            </div>
          </div>
        </div>

        <button className="btn btn-brand" style={{ width:'100%' }} onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
