import { createClient } from "./supabase/server"

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  is_admin: boolean
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
  const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).single()

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
    console.log("[v0] No profile found, attempting to create one")
    const supabase = await createClient()
    const { data: newProfile, error } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        display_name: user.email || "User",
        is_admin: false,
      })
      .select()
      .single()

    if (error) {
      console.log("[v0] Error creating profile:", error)
      return null
    }

    console.log("[v0] Created new profile:", newProfile)
    return newProfile
  }

  return profile
}

export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile()
  return profile?.is_admin || false
}
