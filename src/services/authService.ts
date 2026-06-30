import { supabase } from '@/lib/supabase'
import type { Role } from '@/store/authStore'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signUp(params: {
  email: string
  password: string
  full_name: string
  phone: string
  role: Role
  district: string
}) {
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: {
        full_name: params.full_name,
        role: params.role,
        phone: params.phone,
        district: params.district,
      },
    },
  })
  if (error) throw error

  // Create profile immediately (don't wait for trigger)
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: params.full_name,
      role: params.role,
      phone: params.phone,
      district: params.district,
      is_active: true,
    }, { onConflict: 'id' })
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}
