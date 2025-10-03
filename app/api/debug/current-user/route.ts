import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log("=== Debug Current User ===")
    
    const supabase = await createClient()
    
    // Check current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ 
        error: "Auth error", 
        details: authError.message,
        user: null
      })
    }

    if (!user) {
      console.log("No user logged in")
      return NextResponse.json({ 
        error: "No user logged in",
        user: null
      })
    }

    console.log("Current user:", user.id, user.email)

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ 
        error: "Profile error",
        details: profileError.message,
        user: user,
        profile: null
      })
    }

    console.log("User profile:", profile)
    console.log("Is admin?", profile.role === 'admin')
    console.log("=== End Debug ===")

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        last_sign_in_at: user.last_sign_in_at
      },
      profile: profile,
      isAdmin: profile.role === 'admin'
    })
    
  } catch (error) {
    console.error("Debug current user error:", error)
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}






