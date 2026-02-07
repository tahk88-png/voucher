import { redirect } from "next/navigation"
import TenantShell from "@/components/layout/tenant-shell"
import ShopClient from "@/components/shop/shop-client"
import { prisma } from "@/lib/prisma"
import { getTenantContext } from "@/lib/tenant-context"

export default async function ShopPage() {
  const context = await getTenantContext()
  if (context.mode !== "tenant" || !context.tenant) {
    redirect("/hub")
  }

  const products = await prisma.product.findMany({
    where: { merchantId: context.tenant.id, status: "active" },
    orderBy: { createdAt: "desc" },
  })

  return (
    <TenantShell merchant={context.tenant}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#2D2721]">Shop</h1>
          <p className="text-sm text-[#6B5744]">Browse products and add them to cart.</p>
        </div>
        <ShopClient
          merchantId={context.tenant.id}
          currency={context.tenant.defaultCurrency}
          products={products}
        />
      </div>
    </TenantShell>
  )
}
