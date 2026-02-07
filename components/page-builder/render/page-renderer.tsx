import SectionRenderer from "@/components/page-builder/render/section-renderer"
import { getTenantProducts, getTenantRentals, getTenantVouchers } from "@/lib/commerce-data"

interface PageRendererProps {
  merchant: {
    id: string
    name: string
    slug: string
    defaultCurrency: string
    website: string | null
    supportEmail: string | null
  }
  sections: string[]
}

export default async function PageRenderer({ merchant, sections }: PageRendererProps) {
  const [products, rentals, vouchers] = await Promise.all([
    getTenantProducts(merchant.id),
    getTenantRentals(merchant.id),
    getTenantVouchers(merchant.id),
  ])

  return (
    <div>
      {sections.map((sectionId) => (
        <SectionRenderer
          key={sectionId}
          id={sectionId}
          merchant={merchant}
          products={products}
          rentals={rentals}
          vouchers={vouchers}
        />
      ))}
    </div>
  )
}
