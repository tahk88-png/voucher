"use client"

import * as React from "react"
import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VoucherCard } from "@/components/ui/voucher-card"
import { Separator } from "@/components/ui/separator"

export default function NewVoucherPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    expiryDate: "",
    weekly: false,
    referral: false,
    accentColor: "#3B82F6",
  })

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Voucher"
        description="Design and configure your new voucher campaign"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-base font-semibold text-[#2D2721]">Voucher details</h2>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., 20% Off Your Next Purchase"
                className="border-[rgba(139,115,85,0.15)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 text-sm placeholder:text-[#8B7355] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857]/60 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Valid on all items. Cannot be combined with other offers."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
                className="border-[rgba(139,115,85,0.15)]"
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly">Weekly Drop</Label>
                  <p className="text-sm text-[#6B5744]">
                    Limited-time weekly availability
                  </p>
                </div>
                <input
                  id="weekly"
                  type="checkbox"
                  checked={formData.weekly}
                  onChange={(e) => handleChange("weekly", e.target.checked)}
                  className="h-4 w-4 rounded border-[rgba(139,115,85,0.15)] accent-[#FFC857]"
                  aria-label="Weekly Drop - Limited-time weekly availability"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="referral">Enable Referral Credit</Label>
                  <p className="text-sm text-[#6B5744]">
                    Users earn credit when friends redeem
                  </p>
                </div>
                <input
                  id="referral"
                  type="checkbox"
                  checked={formData.referral}
                  onChange={(e) => handleChange("referral", e.target.checked)}
                  className="h-4 w-4 rounded border-[rgba(139,115,85,0.15)] accent-[#FFC857]"
                  aria-label="Enable Referral Credit - Users earn credit when friends redeem"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="accentColor">Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.accentColor}
                  onChange={(e) => handleChange("accentColor", e.target.value)}
                  className="flex-1 font-mono border-[rgba(139,115,85,0.15)]"
                  aria-label="Brand color hex value"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <WarmButton variant="outline" className="flex-1">
                Save Draft
              </WarmButton>
              <WarmButton className="flex-1">
                Create & Publish
              </WarmButton>
            </div>
          </div>
        </WarmCard>

        {/* Preview */}
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-base font-semibold text-[#2D2721]">Preview</h2>
          <div className="mt-4">
            <VoucherCard
              merchantName="Your Merchant"
              title={formData.title || "Voucher Title"}
              description={formData.description || "Voucher description will appear here"}
              expiryDate={formData.expiryDate ? new Date(formData.expiryDate) : new Date()}
              status="active"
              accentColor={formData.accentColor}
              onPrimaryAction={() => {}}
            />
          </div>
        </WarmCard>
      </div>
    </div>
  )
}
