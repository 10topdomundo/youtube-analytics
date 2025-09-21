import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  console.log("=== Admin Users API Called ===")
  const supabase = await createClient()

  // Check if user is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log("Current user:", user?.id, user?.email)
  console.log("Auth error:", authError)

  if (authError || !user) {
    console.log("Unauthorized - no user or auth error")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()
  
  console.log("User profile:", profile)
  console.log("Profile error:", profileError)

  if (profile?.role !== "admin") {
    console.log("Forbidden - user is not admin. Role:", profile?.role)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  console.log("User is admin, proceeding to fetch users")

  // Get all users with their profiles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    console.log("Profiles:", profiles)

  if (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log("Found profiles:", profiles.length)

  // Use admin client to get auth user data
  const adminSupabase = createAdminClient()
  
  // Transform profiles to match expected frontend structure
  const users = await Promise.all(profiles.map(async (profile) => {
    console.log(`Processing profile: ${profile.email}`)
    
    // Get auth user data for last sign in info
    const { data: authUser } = await adminSupabase.auth.admin.getUserById(profile.user_id)
    
    const transformedUser = {
      id: profile.user_id,
      user_id: profile.user_id,
      display_name: profile.display_name,
      is_admin: profile.role === 'admin',
      created_at: profile.created_at,
      auth_user: {
        email: profile.email,
        last_sign_in_at: authUser.user?.last_sign_in_at || null
      }
    }
    
    console.log("Transformed user:", transformedUser)
    return transformedUser
  }))

  console.log("Final users array length:", users.length)
  console.log("=== End Admin Users API ===")
  
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Check if user is admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { email, password, display_name, is_admin } = await request.json()
  const role = is_admin ? 'admin' : 'user'

  // Create admin client for user creation
  const adminSupabase = createAdminClient()

  // Create user in auth.users using admin client
  const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: display_name,
    },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // Wait a moment for the trigger to create the profile
  await new Promise(resolve => setTimeout(resolve, 100))

  // Get the created profile (created by trigger)
  const { data: newProfile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("*")
    .eq("user_id", newUser.user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: "Profile creation failed: " + profileError.message }, { status: 500 })
  }

  // Update the role if it's different from default
  if (role && role !== "user") {
    const { data: updatedProfile, error: updateError } = await adminSupabase
      .from("profiles")
      .update({ role })
      .eq("user_id", newUser.user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Role update failed: " + updateError.message }, { status: 500 })
    }

    return NextResponse.json({ user: newUser.user, profile: updatedProfile })
  }

  return NextResponse.json({ user: newUser.user, profile: newProfile })
}
