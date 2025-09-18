import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { LoginForm } from "@/components/auth/login-form"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (!user) {
    return <LoginForm />
  }

  redirect("/dashboard")
}
