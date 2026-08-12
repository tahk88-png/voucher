import { Metadata } from "next"
import { SITE_NAME, getBaseUrl, toAbsoluteUrl } from "@/lib/seo"

interface PageMetadataOptions {
  title: string
  description: string
  path: string
  image?: string
  noIndex?: boolean
  keywords?: string[]
}

export function generatePageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  keywords = [],
}: PageMetadataOptions): Metadata {
  // `title` is rendered through the root layout's `%s | SITE_NAME` template, so
  // it must NOT carry the site name itself or every page reads "… | Vouchr | Vouchr".
  // OG/Twitter titles bypass that template, so they keep the full form.
  const fullTitle = `${title} | ${SITE_NAME}`
  const url = toAbsoluteUrl(path)
  const ogImage = image || "/opengraph-image"

  return {
    title,
    description,
    keywords: keywords.length > 0 ? keywords : undefined,
    robots: noIndex ? "noindex,nofollow" : "index,follow",
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  }
}

interface VoucherMetadataOptions {
  title: string
  description: string
  merchantName: string
  value: number
  currency: string
  image?: string
  voucherId: string
}

export function generateVoucherMetadata({
  title,
  description,
  merchantName,
  value,
  currency,
  image,
  voucherId,
}: VoucherMetadataOptions): Metadata {
  // pageTitle omits the site name — the root layout template appends it.
  const pageTitle = `${title} - ${merchantName}`
  const fullTitle = `${pageTitle} | ${SITE_NAME}`
  const formattedValue = `${currency} ${(value / 100).toFixed(2)}`
  const fullDescription = `${description} Worth ${formattedValue}. ${merchantName} on Vouchr.`
  const path = `/voucher/${voucherId}`
  const url = toAbsoluteUrl(path)

  return {
    title: pageTitle,
    description: fullDescription,
    keywords: ["voucher", "discount", "deal", merchantName, title],
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: SITE_NAME,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
    },
  }
}

interface CampaignMetadataOptions {
  title: string
  description: string
  merchantName: string
  startDate: Date
  endDate: Date
  image?: string
  campaignId: string
}

export function generateCampaignMetadata({
  title,
  description,
  merchantName,
  startDate,
  endDate,
  image,
  campaignId,
}: CampaignMetadataOptions): Metadata {
  // pageTitle omits the site name — the root layout template appends it.
  const pageTitle = `${title} - ${merchantName} Campaign`
  const fullTitle = `${pageTitle} | ${SITE_NAME}`
  const fullDescription = `${description} Campaign by ${merchantName}. Ends ${endDate.toLocaleDateString()}.`
  const path = `/campaign/${campaignId}`
  const url = toAbsoluteUrl(path)

  return {
    title: pageTitle,
    description: fullDescription,
    keywords: ["campaign", "promotion", "deal", merchantName, title],
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: SITE_NAME,
      images: image ? [{ url: image, width: 1200, height: 630, alt: title }] : [],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: url,
    },
  }
}

interface MerchantMetadataOptions {
  name: string
  description: string
  slug: string
  logo?: string
  category?: string
}

export function generateMerchantMetadata({
  name,
  description,
  slug,
  logo,
  category,
}: MerchantMetadataOptions): Metadata {
  // `title` omits the site name — the root layout template appends it.
  const fullTitle = `${name} | ${SITE_NAME}`
  const fullDescription = `${description} Browse vouchers, deals, and campaigns from ${name}.`
  const path = `/merchant/${slug}`
  const url = toAbsoluteUrl(path)
  const keywords = ["merchant", "business", name]
  if (category) keywords.push(category)

  return {
    title: name,
    description: fullDescription,
    keywords,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: SITE_NAME,
      images: logo ? [{ url: logo, width: 1200, height: 630, alt: name }] : [],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: logo ? [logo] : [],
    },
    alternates: {
      canonical: url,
    },
  }
}
