import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/seo"

// Rendered per request: the Docker image is built without NEXT_PUBLIC_APP_URL,
// so a build-time render would point crawlers at http://localhost:3000.
export const dynamic = "force-dynamic"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api",
          "/app",
          "/merchant",
          "/admin",
          "/login",
          "/payment",
          "/redeem",
          "/r/",
          "/g/",
          "/tickets/",
          "/*/app",
          "/*/merchant",
          "/*/admin",
          "/*/login",
          "/*/payment",
          "/*/redeem",
          "/*/r/",
          "/*/g/",
          "/*/tickets/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", getBaseUrl()).toString(),
  }
}
