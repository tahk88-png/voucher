"use client"

import { useEffect, useMemo, useState } from "react"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import type { RentalItem } from "@prisma/client"

interface RentalSelection {
  id: string
  name: string
  dailyRate: number
  weeklyRate?: number | null
  currency: string
  days: number
}

export default function RentClient({
  merchantId,
  currency,
  rentals,
}: {
  merchantId: string
  currency: string
  rentals: RentalItem[]
}) {
  const { toast } = useToast()
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selection, setSelection] = useState<RentalSelection | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const days = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    return diff > 0 ? diff : 0
  }, [startDate, endDate])

  const total = selection
    ? Math.floor(selection.days / 7) * (selection.weeklyRate || selection.dailyRate * 7) +
      (selection.days % 7) * selection.dailyRate
    : 0

  useEffect(() => {
    const nextDays = days || 1
    setSelection((prev) => {
      if (!prev || prev.days === nextDays) return prev
      return { ...prev, days: nextDays }
    })
  }, [days])

  const selectRental = (item: RentalItem) => {
    setSelection({
      id: item.id,
      name: item.name,
      dailyRate: item.dailyRate,
      weeklyRate: item.weeklyRate,
      currency: item.currency,
      days: days || 1,
    })
  }

  const submitQuote = async () => {
    if (!selection || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "rental",
          merchantId,
          currency,
          items: [
            {
              id: selection.id,
              name: selection.name,
              quantity: selection.days,
              unitPrice: selection.dailyRate,
            },
          ],
          meta: {
            startDate,
            endDate,
          },
        }),
      })

      if (!res.ok) {
        throw new Error("Quote failed")
      }
      const data = await res.json()
      toast({
        title: "Quote intent created",
        description: `Intent ${data.intentId} for ${formatCurrency(
          data.total,
          currency
        )}`,
      })
    } catch (error) {
      toast({
        title: "Quote error",
        description: "Unable to create rental intent.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <WarmCard padding="lg" className="bg-white">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Rental dates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="rental-start-date" className="text-sm font-medium text-[#2D2721]">
              Start date
            </label>
            <Input
              id="rental-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rental-end-date" className="text-sm font-medium text-[#2D2721]">
              End date
            </label>
            <Input
              id="rental-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <p className="text-sm text-[#6B5744] mt-3">
          {days > 0 ? `${days} rental days selected.` : "Select dates to calculate pricing."}
        </p>
      </WarmCard>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rentals.length === 0 ? (
          <WarmCard padding="lg" className="bg-white col-span-full text-center">
            <p className="text-[#6B5744]">No rentals available yet.</p>
          </WarmCard>
        ) : (
          rentals.map((item) => (
            <WarmCard key={item.id} padding="lg" className="bg-white">
              <p className="font-semibold text-[#2D2721]">{item.name}</p>
              <p className="text-sm text-[#6B5744] mt-1">
                {item.description || "Rental highlight"}
              </p>
              <p className="mt-3 text-[#2D2721] font-bold">
                {formatCurrency(item.dailyRate, item.currency)} / day
              </p>
              {item.weeklyRate ? (
                <p className="text-sm text-[#6B5744]">
                  Weekly: {formatCurrency(item.weeklyRate, item.currency)}
                </p>
              ) : null}
              <WarmButton className="mt-4" onClick={() => selectRental(item)}>
                Select
              </WarmButton>
            </WarmCard>
          ))
        )}
      </div>

      {selection ? (
        <WarmCard padding="lg" className="bg-white">
          <h3 className="text-lg font-semibold text-[#2D2721] mb-2">Selected rental</h3>
          <p className="text-sm text-[#6B5744]">{selection.name}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[#6B5744]">Estimated total</span>
            <span className="text-lg font-bold text-[#2D2721]">
              {formatCurrency(total, selection.currency)}
            </span>
          </div>
          <WarmButton className="w-full mt-4" onClick={submitQuote} disabled={isSubmitting}>
            {isSubmitting ? "Creating intent..." : "Request quote"}
          </WarmButton>
        </WarmCard>
      ) : null}
    </div>
  )
}
