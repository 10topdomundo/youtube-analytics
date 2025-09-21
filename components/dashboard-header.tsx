"use client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// Removed DropdownMenu imports - using custom dropdown instead
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Shield } from "lucide-react"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import type { UserProfile } from "@/lib/auth"

interface DashboardHeaderProps {
  user: User
  profile: UserProfile | null
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      } else {
        router.push("/")
        router.refresh()
      }
    } catch (error) {
      console.error("Sign out exception:", error)
    }
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name?.trim()) {
      // Fallback to email first letter or "U"
      return user.email?.charAt(0).toUpperCase() || "U"
    }
    
    // Clean the name and split by spaces
    const nameParts = name.trim().split(/\s+/).filter(part => part.length > 0)
    
    if (nameParts.length === 0) {
      return user.email?.charAt(0).toUpperCase() || "U"
    }
    
    // Take first letter of first name and last name (max 2 letters)
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase()
    }
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
  }


  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">YouTube Analytics</h2>
            {profile?.role === "admin" && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                <Shield className="w-3 h-3" />
                Admin
              </div>
            )}
          </div>

          <div className="relative">
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full hover:bg-accent border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={profile?.display_name || user.email || ""}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {getInitials(profile?.display_name)}
                  </AvatarFallback>
                </Avatar>
              </Button>

              {/* Custom dropdown menu */}
              {dropdownOpen && (
                <div 
                  className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{profile?.display_name || "User"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false)
                      handleSignOut()
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              )}

              {/* Click outside to close */}
              {dropdownOpen && (
                <div 
                  className="fixed inset-0 z-[9998]" 
                  onClick={() => setDropdownOpen(false)}
                />
              )}
          </div>
        </div>
      </div>
    </header>
  )
}
