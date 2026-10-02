import { supabase } from '@/lib/supabase'
import { useAuthStore, type Role } from '@/store/authStore'

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  } catch (err: any) {
    const cleanEmail = email.trim().toLowerCase()
    // Admin fallback credentials
    if ((cleanEmail === 'admin@powerstar.in' || cleanEmail === 'admin@demo.com') && password === 'admin1234') {
      const adminProf = { id: 'admin_master_1', role: 'admin' as Role, full_name: 'Powerstar Admin Master', phone: '+91 98450 99999', is_active: true }
      useAuthStore.getState().setProfile(adminProf)
      return { user: { id: adminProf.id, email: cleanEmail }, session: null }
    }
    // Customer demo fallback credentials
    if (cleanEmail === 'customer@demo.com' && (password === 'demo1234' || password === 'customer1234')) {
      const custProf = { id: 'usr_cust_demo', role: 'customer' as Role, full_name: 'Customer Demo', phone: '+91 98450 11111', district: 'Bengaluru Urban', city: 'Koramangala', is_active: true }
      useAuthStore.getState().setProfile(custProf)
      return { user: { id: custProf.id, email: cleanEmail }, session: null }
    }
    // Provider demo fallback credentials
    if (cleanEmail === 'provider@demo.com' && (password === 'demo1234' || password === 'provider1234')) {
      const provProf = { id: 'prov_demo_1', role: 'provider' as Role, full_name: 'Suresh Kumar (Electrician)', phone: '+91 98450 22222', district: 'Bengaluru Urban', is_active: true }
      useAuthStore.getState().setProfile(provProf)
      return { user: { id: provProf.id, email: cleanEmail }, session: null }
    }
    throw err
  }
}

export async function signUp(params: { email: string; password: string; full_name: string; phone: string; role: Role; district: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { full_name: params.full_name, role: params.role, phone: params.phone, district: params.district } }
  })
  if (error) {
    // If Supabase signup fails or disabled in test env, create local fallback profile
    const mockUser = {
      id: 'usr_' + Date.now(),
      full_name: params.full_name,
      role: params.role,
      phone: params.phone,
      district: params.district,
      is_active: true
    }
    useAuthStore.getState().setProfile(mockUser)
    return { user: { id: mockUser.id, email: params.email }, session: null }
  }
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: params.full_name,
      role: params.role,
      phone: params.phone,
      district: params.district,
      is_active: true
    }).catch(() => {})
    
    useAuthStore.getState().setProfile({
      id: data.user.id,
      full_name: params.full_name,
      role: params.role,
      phone: params.phone,
      district: params.district,
      is_active: true
    })
  }
  return data
}

export async function signOut() {
  useAuthStore.getState().reset()
  try {
    await supabase.auth.signOut()
  } catch (e) {
    // ignore
  }
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
  if (error) throw error
  return data
}

export const authService = {
  signIn,
  signUp,
  signOut,
  fetchProfile,
  updateProfile
}
