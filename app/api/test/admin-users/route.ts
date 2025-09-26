import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log("=== Testing Admin Users API ===")
    
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Profiles error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Found profiles:", profiles.length)
    
    // Transform profiles to match expected frontend structure
    const users = await Promise.all(profiles.map(async (profile) => {
      console.log(`Processing profile: ${profile.email} (${profile.user_id})`)
      
      // Get auth user data for last sign in info
      const { data: authUser, error: authError } = await adminSupabase.auth.admin.getUserById(profile.user_id)
      
      if (authError) {
        console.error(`Auth error for ${profile.user_id}:`, authError)
      }
      
      const transformedUser = {
        id: profile.user_id,
        user_id: profile.user_id,
        display_name: profile.display_name,
        is_admin: profile.role === 'admin',
        created_at: profile.created_at,
        auth_user: {
          email: profile.email,
          last_sign_in_at: authUser?.user?.last_sign_in_at || null
        }
      }
      
      console.log(`Transformed user:`, transformedUser)
      return transformedUser
    }))

    console.log("=== End Test ===")
    
    return NextResponse.json({ 
      success: true,
      totalUsers: users.length,
      users: users
    })
    
  } catch (error) {
    console.error("Test API error:", error)
    return NextResponse.json({ 
      error: "Test failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


