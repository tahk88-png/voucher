"use client"

import { useState } from "react"
import { QRCodePanel } from "@/components/qr-code-panel"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"

export default function RedeemClient({
  voucherId,
  code,
  expiryDate,
}: {
  voucherId: string
  code: string
  expiryDate: string
}) {
  const [showCode, setShowCode] = useState(false)

  if (!code) {
    return (
      <div className="p-4 sm:p-6">
        <WarmCard padding="lg" className="max-w-lg bg-white">
          <p className="text-sm text-[#6B5744]">Voucher code not available.</p>
          <WarmButton asChild variant="outline" className="mt-4">
            <Link href="/app">Back to wallet</Link>
          </WarmButton>
        </WarmCard>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10">
        <WarmButton
          asChild
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 bg-white/80 backdrop-blur-sm"
          aria-label="Back"
        >
          <Link href={`/app/voucher/${voucherId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </WarmButton>
      </div>
      <QRCodePanel
        code={code}
        expiryDate={expiryDate}
        showCode={showCode}
        onShowCode={() => setShowCode(!showCode)}
      />
    </div>
  )
}
