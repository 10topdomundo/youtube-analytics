import { createClient } from "./supabase/server"

export interface UserProfile {
  user_id: string
  display_name: string | null
  email: string | null
  role: string | null
  created_at: string
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).single()

  if (error || !data) {
    return null
  }

  return data
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  if (!user) return null

  console.log("[v0] Getting profile for user:", user.id)

  const profile = await getUserProfile(user.id)
  console.log("[v0] User profile loaded:", profile)

  if (!profile) {
    console.log("[v0] No profile found, but not attempting to create one to avoid infinite recursion")
    // Don't try to create profile here - let the trigger handle it or create it manually
    // This prevents infinite recursion issues with RLS policies
    return null
  }

  return profile
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.role === "admin" || false
}
