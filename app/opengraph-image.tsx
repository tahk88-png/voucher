import { ImageResponse } from "next/og"
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo"

export const runtime = "edge"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #FFFBF5 0%, #FFF1D9 45%, #FFE5B4 100%)",
          color: "#2D2721",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: "#6B5744",
            marginBottom: 28,
          }}
        >
          {SITE_TAGLINE}
        </div>
        <div style={{ fontSize: 24, color: "#8B7355", maxWidth: 760 }}>
          Vouchers, gift cards, referrals, and event tickets with real-time redemption.
        </div>
      </div>
    ),
    size
  )
}
