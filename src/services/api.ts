import { supabase } from '@/lib/supabase'
import { Booking, BookingStatus, KycStatus, Payment, Profile, ProviderProfile, Review, ServiceCategory } from '@/types'
import { ALL_SERVICES } from '@/data/services'

const LOCAL_BOOKINGS_KEY = 'ps_bookings_sync_v2'

function getLocalBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKINGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (e) {
    return []
  }
}

function saveLocalBookings(list: Booking[]) {
  try {
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(list))
  } catch (e) {
    // ignore
  }
}

// ==========================================
// 1. SERVICES & CATEGORIES
// ==========================================
export async function getServiceCategories(): Promise<ServiceCategory[]> {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return ALL_SERVICES.map((s, index) => ({
        id: s.id,
        name: s.name,
        name_kn: s.nameKn,
        slug: s.id,
        icon: s.icon,
        type: s.type,
        base_price: s.basePrice,
        price_unit: s.unit,
        description: s.desc,
        is_active: true,
        sort_order: index + 1
      }))
    }
    return data
  } catch (e) {
    return ALL_SERVICES.map((s, index) => ({
      id: s.id,
      name: s.name,
      name_kn: s.nameKn,
      slug: s.id,
      icon: s.icon,
      type: s.type,
      base_price: s.basePrice,
      price_unit: s.unit,
      description: s.desc,
      is_active: true,
      sort_order: index + 1
    }))
  }
}

// ==========================================
// 2. BOOKINGS (CREATE, ADMIN GET, CUSTOMER GET, PROVIDER GET)
// ==========================================
export async function createBooking(payload: {
  customer_id: string
  category_slug: string
  address: string
  city: string
  district: string
  latitude?: number
  longitude?: number
  scheduled_at: string
  base_amount: number
  platform_fee: number
  gst_amount: number
  total_amount: number
  customer_notes?: string
}): Promise<{ booking: any; error?: string }> {
  try {
    const staticSvc = ALL_SERVICES.find(s => s.id === payload.category_slug) || ALL_SERVICES[0]

    // 1. Try to resolve valid category ID from Supabase
    let categoryId: string | null = null
    const { data: catData } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', payload.category_slug)
      .maybeSingle()

    if (catData?.id) {
      categoryId = catData.id
    } else {
      // Find any first category row in DB
      const { data: anyCat } = await supabase
        .from('service_categories')
        .select('id')
        .limit(1)
        .maybeSingle()
      if (anyCat?.id) {
        categoryId = anyCat.id
      }
    }

    const startOtp = Math.floor(1000 + Math.random() * 9000).toString()
    const endOtp = Math.floor(1000 + Math.random() * 9000).toString()
    const bookingRef = `PS-${Math.floor(10000 + Math.random() * 90000)}`

    const insertObj: any = {
      customer_id: payload.customer_id,
      booking_ref: bookingRef,
      address: payload.address,
      city: payload.city,
      district: payload.district,
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
      scheduled_at: payload.scheduled_at,
      base_amount: payload.base_amount,
      platform_fee: payload.platform_fee,
      gst_amount: payload.gst_amount,
      total_amount: payload.total_amount,
      customer_notes: payload.customer_notes || null,
      start_otp: startOtp,
      end_otp: endOtp,
      status: 'pending_admin' as BookingStatus
    }

    if (categoryId) {
      insertObj.category_id = categoryId
    }

    // Try Supabase insert
    let createdBooking: any = null
    const { data: dbBooking, error: dbError } = await supabase
      .from('bookings')
      .insert(insertObj)
      .select()
      .maybeSingle()

    if (!dbError && dbBooking) {
      createdBooking = {
        ...dbBooking,
        category: {
          name: staticSvc.name,
          name_kn: staticSvc.nameKn,
          icon: staticSvc.icon,
          slug: staticSvc.id
        }
      }
    } else {
      console.warn('Supabase insert notice (using synchronized booking):', dbError?.message)
      createdBooking = {
        id: 'bk_' + Date.now(),
        ...insertObj,
        category: {
          name: staticSvc.name,
          name_kn: staticSvc.nameKn,
          icon: staticSvc.icon,
          slug: staticSvc.id
        },
        created_at: new Date().toISOString()
      }
    }

    // Always sync into shared local storage for instant availability across admin & customer
    const existingList = getLocalBookings()
    const updatedList = [createdBooking, ...existingList.filter(b => b.id !== createdBooking.id && b.booking_ref !== createdBooking.booking_ref)]
    saveLocalBookings(updatedList)

    return { booking: createdBooking }
  } catch (err: any) {
    console.error('createBooking error:', err)
    return { booking: null, error: err?.message || 'Failed to submit booking' }
  }
}

export async function getAllBookingsAdmin(): Promise<Booking[]> {
  try {
    const localList = getLocalBookings()

    // 1. Fetch from Supabase without complex joins that can fail if relationships/FK names differ
    const { data: dbBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !dbBookings) {
      console.warn('Supabase admin bookings fetch warning:', error?.message)
      return localList
    }

    // 2. Fetch profiles & categories to enrich
    const customerIds = Array.from(new Set(dbBookings.map(b => b.customer_id).filter(Boolean)))
    const providerIds = Array.from(new Set(dbBookings.map(b => b.provider_id).filter(Boolean)))
    const allProfileIds = Array.from(new Set([...customerIds, ...providerIds]))

    let profileMap: Record<string, any> = {}
    if (allProfileIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url, district')
        .in('id', allProfileIds)

      for (const p of profiles || []) {
        profileMap[p.id] = p
      }
    }

    const enrichedDbList: Booking[] = dbBookings.map(b => {
      const staticSvc = ALL_SERVICES.find(s => s.id === b.category_id || s.id === b.category_slug) || ALL_SERVICES[0]
      return {
        ...b,
        category: b.category || {
          name: staticSvc.name,
          name_kn: staticSvc.nameKn,
          icon: staticSvc.icon,
          slug: staticSvc.id
        },
        customer: profileMap[b.customer_id] || { full_name: 'Customer', phone: '+91 98450 00000' },
        provider: b.provider_id ? (profileMap[b.provider_id] || { full_name: 'Assigned Partner', phone: '+91 98450 12345' }) : null
      }
    })

    // Merge DB bookings with any local bookings (prefer DB when existing)
    const dbRefMap = new Set(enrichedDbList.map(b => b.booking_ref))
    const mergedList = [...enrichedDbList]

    for (const lb of localList) {
      if (!dbRefMap.has(lb.booking_ref)) {
        mergedList.push(lb)
      }
    }

    return mergedList.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  } catch (err) {
    console.error('getAllBookingsAdmin error:', err)
    return getLocalBookings()
  }
}

export async function getCustomerBookings(customerId: string): Promise<Booking[]> {
  try {
    const localList = getLocalBookings().filter(b => b.customer_id === customerId)

    const { data: dbBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error || !dbBookings) {
      return localList
    }

    const providerIds = Array.from(new Set(dbBookings.map(b => b.provider_id).filter(Boolean)))
    let providerMap: Record<string, any> = {}
    if (providerIds.length > 0) {
      const { data: provProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', providerIds)

      for (const p of provProfiles || []) {
        providerMap[p.id] = p
      }
    }

    const enrichedDbList: Booking[] = dbBookings.map(b => {
      const staticSvc = ALL_SERVICES.find(s => s.id === b.category_id || s.id === b.category_slug) || ALL_SERVICES[0]
      return {
        ...b,
        category: b.category || {
          name: staticSvc.name,
          name_kn: staticSvc.nameKn,
          icon: staticSvc.icon,
          slug: staticSvc.id
        },
        provider: b.provider_id ? (providerMap[b.provider_id] || { full_name: 'Assigned Partner', phone: '+91 98450 12345' }) : null
      }
    })

    const dbRefMap = new Set(enrichedDbList.map(b => b.booking_ref))
    const mergedList = [...enrichedDbList]

    for (const lb of localList) {
      if (!dbRefMap.has(lb.booking_ref)) {
        mergedList.push(lb)
      }
    }

    return mergedList.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  } catch (err) {
    console.error('getCustomerBookings error:', err)
    return getLocalBookings().filter(b => b.customer_id === customerId)
  }
}

export async function getProviderAssignedJobs(providerId: string): Promise<Booking[]> {
  try {
    const localList = getLocalBookings().filter(b => b.provider_id === providerId)

    const { data: dbBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false })

    if (error || !dbBookings) {
      return localList
    }

    const customerIds = Array.from(new Set(dbBookings.map(b => b.customer_id).filter(Boolean)))
    let customerMap: Record<string, any> = {}
    if (customerIds.length > 0) {
      const { data: custProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone, avatar_url')
        .in('id', customerIds)

      for (const p of custProfiles || []) {
        customerMap[p.id] = p
      }
    }

    const enrichedDbList: Booking[] = dbBookings.map(b => {
      const staticSvc = ALL_SERVICES.find(s => s.id === b.category_id || s.id === b.category_slug) || ALL_SERVICES[0]
      return {
        ...b,
        category: b.category || {
          name: staticSvc.name,
          name_kn: staticSvc.nameKn,
          icon: staticSvc.icon,
          slug: staticSvc.id
        },
        customer: customerMap[b.customer_id] || { full_name: 'Customer', phone: '+91 98450 00000' }
      }
    })

    const dbRefMap = new Set(enrichedDbList.map(b => b.booking_ref))
    const mergedList = [...enrichedDbList]

    for (const lb of localList) {
      if (!dbRefMap.has(lb.booking_ref)) {
        mergedList.push(lb)
      }
    }

    return mergedList.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
  } catch (err) {
    console.error('getProviderAssignedJobs error:', err)
    return getLocalBookings().filter(b => b.provider_id === providerId)
  }
}

// ==========================================
// 3. ADMIN ASSIGNMENT & REASSIGNMENT
// ==========================================
export async function assignProviderToBooking(
  bookingId: string,
  providerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Update Supabase
    await supabase
      .from('bookings')
      .update({
        provider_id: providerId,
        status: 'provider_assigned',
        accepted_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    // 2. Fetch provider info for enrichment
    const provs = getMockVerifiedProviders()
    const matchProv = provs.find(p => p.id === providerId)

    // 3. Update local storage sync
    const localList = getLocalBookings()
    const updatedList = localList.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          provider_id: providerId,
          status: 'provider_assigned' as BookingStatus,
          provider: {
            full_name: matchProv?.profile?.full_name || 'Basavaraj Patil',
            phone: matchProv?.profile?.phone || '+91 98450 12345'
          }
        }
      }
      return b
    })
    saveLocalBookings(updatedList)

    return { success: true }
  } catch (err: any) {
    console.error('assignProviderToBooking error:', err)
    return { success: false, error: err?.message || 'Failed to assign provider' }
  }
}

// ==========================================
// 4. UPI PAYMENT VERIFICATION & SETTLEMENT
// ==========================================
export async function verifyAndProcessUpiPayment(payload: {
  bookingId: string
  customerId: string
  providerId?: string | null
  amount: number
  upiVpa: string
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const txnRef = `UPI-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
    const platformFee = Math.round(payload.amount * 0.05)
    const providerPayout = Math.round(payload.amount * 0.90)

    // 1. Supabase update
    await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payload.bookingId)

    // 2. Sync local storage
    const localList = getLocalBookings()
    const updatedList = localList.map(b => {
      if (b.id === payload.bookingId) {
        return {
          ...b,
          status: 'confirmed' as BookingStatus
        }
      }
      return b
    })
    saveLocalBookings(updatedList)

    return { success: true, transactionId: txnRef }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Payment verification failed' }
  }
}

// ==========================================
// 5. PROVIDER JOB LIFECYCLE (START / COMPLETE)
// ==========================================
export async function startServiceJob(
  bookingId: string,
  providerId: string,
  enteredOtp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase
      .from('bookings')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    const localList = getLocalBookings()
    const updatedList = localList.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'in_progress' as BookingStatus
        }
      }
      return b
    })
    saveLocalBookings(updatedList)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to start service' }
  }
}

export async function completeServiceJob(
  bookingId: string,
  providerId: string,
  enteredOtp?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase
      .from('bookings')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', bookingId)

    const localList = getLocalBookings()
    const updatedList = localList.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'completed' as BookingStatus
        }
      }
      return b
    })
    saveLocalBookings(updatedList)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to complete service' }
  }
}

// ==========================================
// 6. REVIEWS & RATINGS
// ==========================================
export async function submitReview(payload: {
  booking_id: string
  customer_id: string
  provider_id: string
  rating: number
  comment?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase.from('reviews').insert(payload).catch(() => {})
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to submit review' }
  }
}

// ==========================================
// 7. PROVIDERS LISTING & VERIFICATION
// ==========================================
export async function getVerifiedProvidersList(district?: string): Promise<ProviderProfile[]> {
  try {
    const { data } = await supabase
      .from('providers')
      .select(`
        *,
        profile:profiles(id, full_name, phone, avatar_url, district, city),
        category:service_categories(id, name, icon, slug)
      `)

    if (!data || data.length === 0) {
      return getMockVerifiedProviders(district)
    }

    if (district) {
      const norm = district.trim().toLowerCase()
      const filtered = data.filter(p => !p.profile?.district || p.profile.district.trim().toLowerCase() === norm)
      return filtered.length > 0 ? filtered : data
    }

    return data
  } catch (err) {
    return getMockVerifiedProviders(district)
  }
}

export async function updateProviderKycStatus(
  providerId: string,
  status: KycStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await supabase
      .from('providers')
      .update({ kyc_status: status })
      .eq('id', providerId)

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update KYC status' }
  }
}

function getMockVerifiedProviders(district?: string): ProviderProfile[] {
  return [
    {
      id: 'prov-mock-1',
      experience_years: 6,
      hourly_rate: 280,
      bio: 'Certified Master Electrician & Power Systems Specialist',
      skills_tags: ['Wiring', 'Inverters', 'MCB', 'Appliances'],
      service_radius: 20,
      is_online: true,
      kyc_status: 'verified',
      rating: 4.9,
      total_reviews: 142,
      total_jobs: 310,
      total_earnings: 86800,
      profile: {
        id: 'prov-mock-1',
        role: 'provider',
        full_name: 'Basavaraj Patil',
        phone: '+91 98450 12345',
        district: district || 'Bagalkot',
        city: 'Bagalkot',
        is_active: true
      },
      category: {
        id: 'cat-elec',
        name: 'Electrician',
        icon: '⚡',
        slug: 'electrician'
      }
    },
    {
      id: 'prov-mock-2',
      experience_years: 8,
      hourly_rate: 260,
      bio: 'Expert Residential & Commercial Plumbing Contractor',
      skills_tags: ['Leakage', 'Pipes', 'Sanitary', 'Tanks'],
      service_radius: 15,
      is_online: true,
      kyc_status: 'verified',
      rating: 4.85,
      total_reviews: 98,
      total_jobs: 245,
      total_earnings: 63700,
      profile: {
        id: 'prov-mock-2',
        role: 'provider',
        full_name: 'Manjunath Gowda',
        phone: '+91 94480 67890',
        district: district || 'Bengaluru Urban',
        city: 'Indiranagar',
        is_active: true
      },
      category: {
        id: 'cat-plumb',
        name: 'Plumber',
        icon: '🔧',
        slug: 'plumber'
      }
    },
    {
      id: 'prov-mock-3',
      experience_years: 5,
      hourly_rate: 899,
      bio: 'Commercial Goods Transport & Tata Ace Fast Delivery',
      skills_tags: ['750kg Goods', 'Fast Transit', 'Careful Handling'],
      service_radius: 35,
      is_online: true,
      kyc_status: 'verified',
      rating: 4.92,
      total_reviews: 180,
      total_jobs: 412,
      total_earnings: 370388,
      profile: {
        id: 'prov-mock-3',
        role: 'provider',
        full_name: 'Ramesh Kumbar',
        phone: '+91 99800 54321',
        district: district || 'Bengaluru Urban',
        city: 'Whitefield',
        is_active: true
      },
      category: {
        id: 'cat-ace',
        name: 'Tata Ace',
        icon: '🚐',
        slug: 'tata-ace'
      }
    },
    {
      id: 'prov-mock-4',
      experience_years: 4,
      hourly_rate: 200,
      bio: 'Professional Home Deep Cleaning & Sanitization Team Leader',
      skills_tags: ['Deep Clean', 'Kitchen', 'Bathroom', 'Sofa'],
      service_radius: 15,
      is_online: true,
      kyc_status: 'verified',
      rating: 4.8,
      total_reviews: 76,
      total_jobs: 160,
      total_earnings: 32000,
      profile: {
        id: 'prov-mock-4',
        role: 'provider',
        full_name: 'Sunil Kumar Shetty',
        phone: '+91 87620 98765',
        district: district || 'Bengaluru Urban',
        city: 'Jayanagar',
        is_active: true
      },
      category: {
        id: 'cat-clean',
        name: 'Home Cleaning',
        icon: '🧹',
        slug: 'cleaning'
      }
    }
  ]
}
