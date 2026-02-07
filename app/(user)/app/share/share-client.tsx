"use client"

import { useState } from "react"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Gift, Share2 } from "lucide-react"
import { showSuccess } from "@/lib/toast-helpers"
import Link from "next/link"

interface ShareRow {
  id: string
  friendLabel: string
  voucherTitle: string
  createdAt: string
  status: string
}

export default function ShareClient({
  inviteLink,
  shares,
}: {
  inviteLink: string
  shares: ShareRow[]
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      showSuccess("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2721]">Share & Earn</h1>
        <p className="text-sm text-[#6B5744]">
          Share vouchers with friends and earn credit when they redeem.
        </p>
      </div>

      <WarmCard padding="lg" className="bg-white">
        <div>
          <h2 className="text-lg font-semibold text-[#2D2721]">Your invite link</h2>
          <p className="text-sm text-[#6B5744]">
            Share this link with friends. When they redeem a voucher, you earn credit.
          </p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="flex-1 font-mono text-sm border-[#E7DCC7]"
              aria-label="Invite link"
            />
            <WarmButton
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="shrink-0"
              aria-label="Copy invite link"
            >
              {copied ? <Check className="h-4 w-4 text-[#9DB5A5]" /> : <Copy className="h-4 w-4" />}
            </WarmButton>
          </div>
          <WarmButton onClick={handleCopy} className="w-full" variant="secondary">
            {copied ? "Copied!" : "Copy link"}
          </WarmButton>
        </div>
      </WarmCard>

      <WarmCard padding="lg" className="bg-white">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#E17B5C]" />
          <h2 className="text-lg font-semibold text-[#2D2721]">How rewards work</h2>
        </div>
        <div className="space-y-2 text-sm text-[#6B5744] mt-3">
          <p>
            When you share a voucher and a friend redeems it, you automatically earn
            merchant credit.
          </p>
          <p>
            Credits are non-transferable and expire based on merchant settings. Check your
            wallet to see your current balance.
          </p>
        </div>
      </WarmCard>

      <div>
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Recent shares</h2>
        <div className="space-y-3">
          {shares.length > 0 ? (
            shares.map((share) => (
              <WarmCard key={share.id} padding="lg" className="bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-[#2D2721]">{share.friendLabel}</p>
                    <p className="text-sm text-[#6B5744] mt-1">{share.voucherTitle}</p>
                    <p className="text-xs text-[#8B7355] mt-2">
                      {new Date(share.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="ml-4">
                    {share.status === "redeemed" ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#9DB5A5]/20 text-[#2D2721]">
                        Redeemed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#FFF9ED] text-[#8B7355]">
                        {share.status}
                      </span>
                    )}
                  </div>
                </div>
              </WarmCard>
            ))
          ) : (
            <WarmCard padding="lg" className="bg-white">
              <div className="py-10 text-center">
                <Share2 className="h-12 w-12 mx-auto text-[#8B7355] mb-4" />
                <h3 className="text-lg font-semibold text-[#2D2721] mb-2">No shares yet</h3>
                <p className="text-sm text-[#6B5744] mb-4">
                  Start sharing vouchers with friends to earn credit when they redeem.
                </p>
                <WarmButton asChild variant="outline">
                  <Link href="/app">View vouchers</Link>
                </WarmButton>
              </div>
            </WarmCard>
          )}
        </div>
      </div>
    </div>
  )
}
