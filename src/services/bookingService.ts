import { supabase } from '@/lib/supabase'

// ── BOOKINGS ──────────────────────────────────────────────────

export async function createBooking(params: {
  customer_id: string; category_id: string; address: string
  city: string; district: string; base_amount: number
  platform_fee: number; gst_amount: number; total_amount: number
  customer_notes?: string; scheduled_at?: string
}) {
  const { data, error } = await supabase
    .from('bookings').insert(params)
    .select('*, category:service_categories(*)').single()
  if (error) throw error
  return data
}

export async function getCustomerBookings(customerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, category:service_categories(name,icon,slug)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getAvailableBookings(district: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      category:service_categories(name,icon),
      customer:profiles!bookings_customer_id_fkey(full_name,phone,district)
    `)
    .eq('status', 'pending')
    .eq('district', district)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data ?? []
}

export async function getProviderBookings(providerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      category:service_categories(name,icon),
      customer:profiles!bookings_customer_id_fkey(full_name,phone)
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function acceptBooking(bookingId: string, providerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ provider_id: providerId, status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', bookingId).eq('status', 'pending')
    .select().single()
  if (error) throw error
  return data
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const updates: Record<string, string> = { status }
  if (status === 'active')    updates.started_at = new Date().toISOString()
  if (status === 'completed') updates.completed_at = new Date().toISOString()
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString()
  const { data, error } = await supabase.from('bookings').update(updates).eq('id', bookingId).select().single()
  if (error) throw error
  return data
}

export async function cancelCustomerBooking(bookingId: string, customerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: 'Cancelled by customer' })
    .eq('id', bookingId)
    .eq('customer_id', customerId)
    .eq('status', 'pending')
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This booking can no longer be cancelled.')
  return data
}

export async function declineBooking(bookingId: string, providerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      provider_id: providerId,
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Declined by provider',
    })
    .eq('id', bookingId)
    .eq('status', 'pending')
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This request is no longer available.')
  return data
}

export async function completeProviderBooking(bookingId: string, providerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('provider_id', providerId)
    .in('status', ['accepted', 'active'])
    .select()
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('This booking is not assigned to you or is already closed.')
  return data
}

export async function getAllBookingsAdmin() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      category:service_categories(name,icon,type),
      customer:profiles!bookings_customer_id_fkey(full_name,phone),
      provider:providers(profile:profiles(full_name))
    `)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return data ?? []
}

export async function getPlatformStats() {
  const [b, prov, cust, rev] = await Promise.all([
    supabase.from('bookings').select('id,status,total_amount'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'provider'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('bookings').select('total_amount').eq('status', 'completed'),
  ])
  const revenue = (rev.data ?? []).reduce((s: number, x: any) => s + (x.total_amount ?? 0), 0)
  const bookings = b.data ?? []
  return {
    totalBookings:   bookings.length,
    totalProviders:  prov.count ?? 0,
    totalCustomers:  cust.count ?? 0,
    totalRevenue:    revenue,
    activeBookings:  bookings.filter((x: any) => ['active','accepted'].includes(x.status)).length,
    pendingBookings: bookings.filter((x: any) => x.status === 'pending').length,
    avgRating:       '4.8',
  }
}

export function subscribeToBookings(cb: (p: any) => void) {
  return supabase.channel('bookings-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, cb)
    .subscribe()
}

// ── PROVIDERS ─────────────────────────────────────────────────

export async function getVerifiedProviders(district: string, categorySlug?: string) {
  let q = supabase
    .from('providers')
    .select(`
      *,
      profile:profiles(full_name,phone,district,city),
      category:service_categories(name,icon,slug,base_price,price_unit)
    `)
    .eq('kyc_status', 'verified')
    .eq('is_online', true)
    .order('rating', { ascending: false })

  if (categorySlug) {
    const { data: cat } = await supabase
      .from('service_categories').select('id').eq('slug', categorySlug).maybeSingle()
    if (cat?.id) q = q.eq('category_id', cat.id)
  }
  const { data, error } = await q
  if (error) throw error
  // Filter by district client-side (profile district)
  return (data ?? []).filter((p: any) => !district || p.profile?.district === district)
}

export async function getAllProvidersAdmin() {
  const { data, error } = await supabase
    .from('providers')
    .select('*, profile:profiles(full_name,phone,district,city,created_at), category:service_categories(name,icon)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function updateKycStatus(providerId: string, status: 'verified'|'rejected') {
  const { error } = await supabase
    .from('providers').update({ kyc_status: status }).eq('id', providerId)
  if (error) throw error
  // Send notification
  await supabase.from('notifications').insert({
    user_id: providerId,
    title:   status === 'verified' ? 'KYC Approved!' : 'KYC Rejected',
    body:    status === 'verified'
      ? 'Your KYC has been approved. Go online and start receiving bookings!'
      : 'Your KYC was rejected. Please re-upload clear documents.',
    type: 'kyc',
    data: { status },
  })
}

export async function upsertProvider(profileId: string, data: {
  category_id: string; experience_years: number
  hourly_rate: number; bio?: string; skills_tags?: string[]
}) {
  const { error } = await supabase
    .from('providers')
    .upsert({ id: profileId, ...data, kyc_status: 'pending', is_online: false }, { onConflict: 'id' })
  if (error) throw error
}

export async function getProviderProfile(profileId: string) {
  const { data, error } = await supabase
    .from('providers')
    .select('*, category:service_categories(name,icon,slug,base_price,price_unit)')
    .eq('id', profileId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function uploadKycDoc(providerId: string, file: File, docType: string) {
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')
  const fieldMap: Record<string,string> = {
    aadhaar: 'aadhaar_url', selfie: 'selfie_url',
    certificate: 'certificate_url', bank: 'bank_passbook_url',
  }
  const field = fieldMap[docType]
  if (!field || !ext) throw new Error('Unsupported document type')
  const path = `${providerId}/${docType}.${ext}`
  const { error: upErr } = await supabase.storage.from('kyc-documents').upload(path, file, { upsert: true })
  if (upErr) throw upErr

  // The bucket is private. Persist the object path, not a public URL.
  const { error: providerError } = await supabase.from('providers').upsert({
    id: providerId, [field]: path, kyc_status: 'submitted',
  }, { onConflict: 'id' })
  if (providerError) throw providerError
  return path
}

// ── NOTIFICATIONS ─────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const { data } = await supabase
    .from('notifications').select('*')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  return data ?? []
}

export async function markNotifRead(id: string) {
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export function subscribeToNotifications(userId: string, cb: () => void) {
  return supabase.channel(`notifs-${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, cb)
    .subscribe()
}
