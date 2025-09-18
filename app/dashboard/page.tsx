import { redirect } from "next/navigation"
import { getCurrentUser, getCurrentUserProfile } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard-content"
import { AdminDashboard } from "@/components/admin-dashboard"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  const profile = await getCurrentUserProfile()

  console.log("[v0] Dashboard - User:", user?.id)
  console.log("[v0] Dashboard - Profile:", profile)
  console.log("[v0] Dashboard - Is Admin:", profile?.is_admin)

  if (!user) {
    redirect("/")
  }

  if (profile?.is_admin) {
    console.log("[v0] Rendering AdminDashboard for admin user")
    return <AdminDashboard user={user} profile={profile} />
  }

  console.log("[v0] Rendering regular DashboardContent")
  return <DashboardContent user={user} profile={profile} />
}
