"use client"

import * as React from "react"
import { useState } from "react"
import { PageHeader } from "@/components/page-header"
import { WarmCard } from "@/components/warm-card"
import { WarmButton } from "@/components/warm-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VoucherCard } from "@/components/ui/voucher-card"
import { Upload } from "lucide-react"

export default function BrandPage() {
  const [brandColor, setBrandColor] = useState("#3B82F6")
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined)

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Settings"
        description="Customize your brand appearance across vouchers"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Form */}
        <div className="space-y-6">
          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div>
              <h2 className="text-base font-semibold text-[#2D2721]">Logo</h2>
              <p className="text-sm text-[#6B5744]">
                Upload your merchant logo (recommended: 200x200px, PNG or SVG).
              </p>
            </div>
            <div className="space-y-4 mt-4">
              {logoUrl && (
                <div className="w-32 h-32 border border-[rgba(139,115,85,0.15)] rounded-lg p-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo" className="cursor-pointer">
                  <WarmButton variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </span>
                  </WarmButton>
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
            <div>
              <h2 className="text-base font-semibold text-[#2D2721]">Brand color</h2>
              <p className="text-sm text-[#6B5744]">
                Set your primary brand color for vouchers and buttons.
              </p>
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="brandColor">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="brandColor"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="flex-1 font-mono border-[rgba(139,115,85,0.15)]"
                  aria-label="Brand color hex value"
                />
              </div>
            </div>
          </WarmCard>

          <WarmButton className="w-full">Save changes</WarmButton>
        </div>

        {/* Preview */}
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <div>
            <h2 className="text-base font-semibold text-[#2D2721]">Preview</h2>
            <p className="text-sm text-[#6B5744]">See how your brand appears on vouchers.</p>
          </div>
          <div className="mt-4">
            <VoucherCard
              merchantName="Your Merchant"
              merchantLogoUrl={logoUrl}
              title="20% Off Your Next Purchase"
              description="Valid on all items. Cannot be combined with other offers."
              expiryDate={new Date("2024-12-31")}
              status="active"
              accentColor={brandColor}
              onPrimaryAction={() => {}}
            />
          </div>
        </WarmCard>
      </div>
    </div>
  )
}
