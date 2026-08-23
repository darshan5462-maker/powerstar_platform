import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PageHeader from '@/components/layout/PageHeader'
import toast from 'react-hot-toast'

interface Category { id: string; name: string; icon: string | null; type: string; base_price: number; price_unit: string | null; is_active: boolean }

export default function AdminPricing() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase.from('service_categories').select('id,name,icon,type,base_price,price_unit,is_active').order('sort_order')
    if (queryError) { setError('Pricing could not be loaded right now.'); setCategories([]) }
    else setCategories((data ?? []) as Category[])
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  async function save(category: Category) {
    const price = Number(category.base_price)
    if (!Number.isFinite(price) || price < 0) { toast.error('Enter a valid non-negative price'); return }
    setSaving(category.id)
    const { error: updateError } = await supabase.from('service_categories').update({ base_price: price }).eq('id', category.id)
    if (updateError) toast.error(updateError.message || 'Could not save price')
    else toast.success(`${category.name} pricing updated`)
    setSaving(null)
  }

  return (
    <div>
      <PageHeader title="Pricing" subtitle="Manage base rates shown to customers" action={<button className="btn btn-outline btn-sm" onClick={() => void load()} disabled={loading}>↻ Refresh</button>} />
      <div className="page-content">
        <div className="glass" style={{ padding:18, marginBottom:18, color:'var(--text2)', fontSize:13, lineHeight:1.6 }}>Prices are configuration data. Provider-specific rates and payment totals are calculated separately; review any pricing change before publishing it.</div>
        {loading ? <div className="glass" style={{ padding:48, textAlign:'center', color:'var(--text3)' }}>Loading pricing…</div> : error ? <div className="glass" role="alert" style={{ padding:48, textAlign:'center' }}><p style={{ marginBottom:12 }}>{error}</p><button className="btn btn-outline btn-sm" onClick={() => void load()}>Try again</button></div> : <div className="glass" style={{ overflow:'auto' }}><table className="data-table"><thead><tr><th>Service</th><th>Type</th><th>Base price</th><th>Unit</th><th>Action</th></tr></thead><tbody>{categories.map(category => <tr key={category.id}><td><span style={{ marginRight:6 }}>{category.icon}</span>{category.name}</td><td style={{ textTransform:'capitalize', color:'var(--text2)' }}>{category.type}</td><td><input className="input" style={{ maxWidth:140 }} type="number" min={0} value={category.base_price ?? 0} onChange={event => setCategories(items => items.map(item => item.id === category.id ? { ...item, base_price: Number(event.target.value) } : item))} /></td><td>{category.price_unit ?? '—'}</td><td><button className="btn btn-brand btn-sm" onClick={() => void save(category)} disabled={saving === category.id}>{saving === category.id ? 'Saving…' : 'Save'}</button></td></tr>)}</tbody></table></div>}
      </div>
    </div>
  )
}
