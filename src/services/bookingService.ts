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
