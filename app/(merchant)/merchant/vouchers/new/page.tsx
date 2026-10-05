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
import { useTranslations } from "next-intl"

export default function NewVoucherPage() {
  const t = useTranslations("merchantLegacy.newVoucher")
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
        title={t("title")}
        description={t("description")}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-base font-semibold text-[#2D2721]">{t("detailsHeading")}</h2>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("titleLabel")}</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="border-[rgba(139,115,85,0.15)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("descriptionLabel")}</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-[rgba(139,115,85,0.15)] bg-white px-3 py-2 text-sm placeholder:text-[#8B7355] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#cc785c]/60 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">{t("expiryDateLabel")}</Label>
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
                  <Label htmlFor="weekly">{t("weeklyLabel")}</Label>
                  <p className="text-sm text-[#6B5744]">
                    {t("weeklyHint")}
                  </p>
                </div>
                <input
                  id="weekly"
                  type="checkbox"
                  checked={formData.weekly}
                  onChange={(e) => handleChange("weekly", e.target.checked)}
                  className="h-4 w-4 rounded border-[rgba(139,115,85,0.15)] accent-[#cc785c]"
                  aria-label={t("weeklyAria")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="referral">{t("referralLabel")}</Label>
                  <p className="text-sm text-[#6B5744]">
                    {t("referralHint")}
                  </p>
                </div>
                <input
                  id="referral"
                  type="checkbox"
                  checked={formData.referral}
                  onChange={(e) => handleChange("referral", e.target.checked)}
                  className="h-4 w-4 rounded border-[rgba(139,115,85,0.15)] accent-[#cc785c]"
                  aria-label={t("referralAria")}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="accentColor">{t("brandColorLabel")}</Label>
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
                  aria-label={t("brandColorHexLabel")}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <WarmButton variant="outline" className="flex-1">
                {t("saveDraft")}
              </WarmButton>
              <WarmButton className="flex-1">
                {t("createAndPublish")}
              </WarmButton>
            </div>
          </div>
        </WarmCard>

        {/* Preview */}
        <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
          <h2 className="text-base font-semibold text-[#2D2721]">{t("previewHeading")}</h2>
          <div className="mt-4">
            <VoucherCard
              merchantName={t("sampleMerchant")}
              title={formData.title || t("sampleTitle")}
              description={formData.description || t("sampleDescription")}
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
