import { supabase } from '@/lib/supabase'

export async function getProviderBookings(providerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      category:service_categories(name, icon, slug),
      customer:profiles!bookings_customer_id_fkey(full_name, phone)
    `)
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching provider bookings:', error.message)
    return []
  }
  return data || []
}

export async function acceptBooking(bookingId: string, providerId: string) {
  // In the new flow, the provider is assigned by admin, but they still need to 'accept' it.
  // Wait, let's look at the UI. The provider clicks 'Accept Job'.
  // The status transitions from 'provider_assigned' -> 'payment_pending'.
  // Because "Booking becomes PAYMENT_PENDING -> Customer opens payment..."
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'payment_pending', accepted_at: new Date().toISOString() })
    .eq('id', bookingId)
    .eq('provider_id', providerId)
    
  if (error) throw error
  return data
}

export async function getProviderProfile(providerId: string) {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', providerId)
    .single()
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching provider profile:', error.message)
    return null
  }
  return data
}

export async function uploadKycDoc(providerId: string, file: File, type: 'aadhaar' | 'selfie' | 'certificate' | 'bank') {
  const ext = file.name.split('.').pop()
  const filePath = `${providerId}/${type}_${Date.now()}.${ext}`
  
  const { error: uploadError } = await supabase.storage
    .from('kyc-documents')
    .upload(filePath, file, { upsert: true })
    
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('kyc-documents')
    .getPublicUrl(filePath)

  const urlField = type === 'bank' ? 'bank_passbook_url' : `${type}_url`
  
  const { error: updateError } = await supabase
    .from('providers')
    .update({ [urlField]: publicUrl })
    .eq('id', providerId)

  if (updateError) throw updateError
  
  return publicUrl
}
