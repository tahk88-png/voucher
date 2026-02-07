import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function DashboardAliasPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  // Canonical entry point for authenticated users in this codebase.
  redirect("/merchant")
}

