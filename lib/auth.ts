import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  role: 'school_owner' | 'teacher'
  school_id: string
  full_name: string
  subject?: string
  qualification?: string
  experience?: string
  created_at: string
  updated_at: string
}

export async function signUp(email: string, password: string, fullName: string, role: 'school_owner' | 'teacher' = 'teacher') {
  // First create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { data: null, error: authError }
  }

  if (authData.user) {
    // Create user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        // For school_owner, create a new school_id, for teacher, they'll need to be assigned later
        school_id: role === 'school_owner' ? crypto.randomUUID() : null
      })
      .select()
      .single()

    if (userError) {
      return { data: null, error: userError }
    }

    return { data: { auth: authData, user: userData }, error: null }
  }

  return { data: authData, error: null }
}

export async function signIn(email: string, password: string) {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { data: null, error: authError }
  }

  if (authData.user) {
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError) {
      return { data: null, error: userError }
    }

    return { data: { auth: authData, user: userData }, error: null }
  }

  return { data: authData, error: null }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) return null

  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (error || !userData) return null

  return userData as User
}

export async function getCurrentAuthUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}