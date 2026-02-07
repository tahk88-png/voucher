import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/seo"

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
          "/v/",
          "/g/",
          "/tickets/",
          "/*/app",
          "/*/merchant",
          "/*/admin",
          "/*/login",
          "/*/payment",
          "/*/redeem",
          "/*/r/",
          "/*/v/",
          "/*/g/",
          "/*/tickets/",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", getBaseUrl()).toString(),
  }
}
