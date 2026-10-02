export type Role = 'customer' | 'provider' | 'admin'

export type BookingStatus =
  | 'pending_admin'
  | 'provider_assigned'
  | 'payment_pending'
  | 'payment_success'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'payment_failed'

export type PaymentStatus =
  | 'pending'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'held'
  | 'released'
  | 'refunded'

export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected'

export type ServiceType = 'manpower' | 'vehicle' | 'rto' | 'financial'

export interface Profile {
  id: string
  role: Role
  full_name: string
  phone?: string
  avatar_url?: string
  district?: string
  city?: string
  address?: string
  latitude?: number
  longitude?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProviderProfile {
  id: string
  category_id?: string
  experience_years: number
  hourly_rate?: number
  bio?: string
  skills_tags?: string[]
  service_radius: number
  is_online: boolean
  kyc_status: KycStatus
  rating: number
  total_reviews: number
  total_jobs: number
  total_earnings: number
  aadhaar_url?: string
  selfie_url?: string
  certificate_url?: string
  bank_passbook_url?: string
  bank_account_no?: string
  bank_ifsc?: string
  created_at?: string
  profile?: Profile
  category?: {
    id: string
    name: string
    icon: string
    slug: string
  }
}

export interface ServiceCategory {
  id: string
  name: string
  name_kn?: string
  slug: string
  icon?: string
  type: ServiceType
  base_price: number
  price_unit?: string
  description?: string
  is_active: boolean
  sort_order: number
}

export interface Booking {
  id: string
  booking_ref: string
  customer_id: string
  provider_id?: string | null
  category_id: string
  status: BookingStatus
  address: string
  city: string
  district: string
  latitude?: number
  longitude?: number
  scheduled_at?: string
  accepted_at?: string
  started_at?: string
  completed_at?: string
  cancelled_at?: string
  base_amount: number
  platform_fee: number
  gst_amount: number
  total_amount: number
  start_otp?: string
  end_otp?: string
  customer_notes?: string
  cancellation_reason?: string
  created_at: string
  updated_at?: string

  // Joined fields
  category?: {
    id?: string
    name: string
    name_kn?: string
    icon: string
    slug?: string
  }
  customer?: {
    full_name: string
    phone?: string
    avatar_url?: string
  }
  provider?: {
    full_name: string
    phone?: string
    avatar_url?: string
  }
  provider_details?: ProviderProfile
  payment?: Payment
}

export interface Payment {
  id: string
  booking_id: string
  customer_id: string
  provider_id?: string | null
  amount: number
  platform_fee: number
  provider_payout: number
  status: PaymentStatus
  method: 'upi'
  upi_vpa?: string
  transaction_ref?: string
  created_at: string
}

export interface Review {
  id: string
  booking_id: string
  customer_id: string
  provider_id: string
  rating: number
  comment?: string
  created_at: string
  customer?: {
    full_name: string
    avatar_url?: string
  }
}

export interface Address {
  id: string
  title: 'Home' | 'Work' | 'Other'
  address: string
  district: string
  city: string
  isDefault?: boolean
  landmark?: string
}
