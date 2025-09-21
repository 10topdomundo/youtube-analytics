import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard-content"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentUserProfile()

  console.log("[v0] Dashboard - User:", user?.id)
  console.log("[v0] Dashboard - Profile:", profile)
  console.log("[v0] Dashboard - Is Admin:", profile?.role === "admin")

  if (!user) {
    redirect("/")
  }

  // If no profile exists, show a message or create one manually
  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-card text-card-foreground rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-2">Profile Setup Required</h2>
          <p className="text-muted-foreground mb-4">
            Your user profile needs to be created. Please contact an administrator or try refreshing the page.
          </p>
          <p className="text-sm text-muted-foreground">
            User ID: {user.id}
          </p>
        </div>
      </div>
    )
  }

  if (profile?.role === "admin") {
    console.log("[v0] Rendering AdminDashboard for admin user")
    return <AdminDashboard user={user} profile={profile} />
  }

  console.log("[v0] Rendering regular DashboardContent")
  return <DashboardContent user={user} profile={profile} />
}
