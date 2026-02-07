import { SITE_NAME, getBaseUrl, toAbsoluteUrl } from "@/lib/seo"

export function generateOrganizationStructuredData(
  merchantName: string,
  merchantSlug: string,
  logo?: string,
  description?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: merchantName,
    url: toAbsoluteUrl(`/merchant/${merchantSlug}`),
    logo: logo ? toAbsoluteUrl(logo) : undefined,
    description,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
  }
}

export function generateProductStructuredData(
  voucherTitle: string,
  description: string,
  value: number,
  currency: string,
  merchantName: string,
  image?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: voucherTitle,
    description,
    image: image ? toAbsoluteUrl(image) : undefined,
    brand: {
      "@type": "Brand",
      name: merchantName,
    },
    offers: {
      "@type": "Offer",
      price: (value / 100).toFixed(2),
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: merchantName,
      },
    },
  }
}

export function generateEventStructuredData(
  eventName: string,
  description: string,
  startDate: Date,
  endDate: Date | null,
  location: string,
  merchantName: string,
  image?: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: eventName,
    description,
    startDate: startDate.toISOString(),
    endDate: endDate?.toISOString(),
    location: {
      "@type": "Place",
      name: location,
    },
    image: image ? toAbsoluteUrl(image) : undefined,
    organizer: {
      "@type": "Organization",
      name: merchantName,
    },
  }
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; path: string }>
) {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  }
}
