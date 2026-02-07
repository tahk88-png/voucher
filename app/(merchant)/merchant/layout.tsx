import * as React from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MerchantSidebar } from "@/components/merchant-sidebar"

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/merchant")
  }

  const member = await prisma.merchantMember.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!member) {
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
