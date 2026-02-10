import * as React from "react"
import { redirect } from "next/navigation"
import { MerchantSidebar } from "@/components/merchant-sidebar"
import { AccessControlError, requireAuthenticatedProfile } from "@/lib/access-control"

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let profile
  try {
    profile = await requireAuthenticatedProfile()
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect("/login?callbackUrl=/merchant")
    }
    redirect("/login")
  }

  const hasTenantAccess = profile.roles.includes("tenant_owner") || profile.roles.includes("tenant_staff")
  if (!hasTenantAccess) {
    redirect("/app")
  }

  return (
    <div className="flex min-h-screen">
      <MerchantSidebar />
      <div className="flex-1 md:ml-64">
        <div className="container py-6 px-4">
          {children}
        </div>
      </div>
    </div>
  )
}
