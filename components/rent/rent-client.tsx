"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { Input } from "@/components/ui/input"
import { showError, showSuccess } from "@/lib/toast-helpers"
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

interface RentalBooking {
  id: string
  startDate: string
  endDate: string
  days: number
  dailyRate: number
  totalPrice: number
  currency: string
  status: string
  notes: string | null
  rejectionReason: string | null
  createdAt: string
  rentalItem: { id: string; name: string; imageUrl: string | null }
  merchant: { id: string; name: string; slug: string }
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  active: "bg-emerald-100 text-emerald-800",
  returned: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-100 text-gray-500",
}

const BOOKING_STATUSES = Object.keys(STATUS_COLORS)

export default function RentClient({
  merchantId,
  currency,
  rentals,
}: {
  merchantId: string
  currency: string
  rentals: RentalItem[]
}) {
  const t = useTranslations("shop.rentClient")
  const locale = useLocale()
  const statusLabel = (status: string) =>
    BOOKING_STATUSES.includes(status) ? t(`status.${status}`) : status
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [selection, setSelection] = useState<RentalSelection | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookings, setBookings] = useState<RentalBooking[]>([])
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

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

  const fetchBookings = useCallback(() => {
    setBookingsLoading(true)
    fetch("/api/rentals")
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data.bookings) ? data.bookings : []))
      .catch(() => {})
      .finally(() => setBookingsLoading(false))
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const submitBooking = async () => {
    if (!selection || isSubmitting) return
    if (!startDate || !endDate) {
      showError(t("selectDatesError"))
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          rentalItemId: selection.id,
          startDate,
          endDate,
          notes: notes || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || t("bookingFailed"))
      }

      const data = await res.json()
      showSuccess(
        t("bookingCreated", {
          name: data.booking.rentalItem?.name || selection.name,
          total: formatCurrency(data.booking.totalPrice, data.booking.currency),
        }),
        t("bookingSubmitted")
      )
      setSelection(null)
      setNotes("")
      fetchBookings()
    } catch (error) {
      showError(error instanceof Error ? error.message : t("bookingCreateFailed"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelBooking = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await fetch(`/api/rentals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      if (res.ok) {
        showSuccess(t("bookingCancelled"))
        fetchBookings()
      } else {
        const err = await res.json().catch(() => ({}))
        showError(err.error || t("cancelFailed"))
      }
    } catch {
      showError(t("cancelFailed"))
    } finally {
      setCancellingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t("datesHeading")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="rental-start-date" className="text-sm font-medium text-[var(--text)]">
              {t("startDate")}
            </label>
            <Input
              id="rental-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="rental-end-date" className="text-sm font-medium text-[var(--text)]">
              {t("endDate")}
            </label>
            <Input
              id="rental-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-3">
          {days > 0 ? t("daysSelected", { count: days }) : t("selectDatesHint")}
        </p>
      </WarmCard>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rentals.length === 0 ? (
          <WarmCard padding="lg" className="bg-[var(--surface)] col-span-full text-center">
            <p className="text-[var(--text-muted)]">{t("empty")}</p>
          </WarmCard>
        ) : (
          rentals.map((item) => (
            <WarmCard key={item.id} padding="lg" className="bg-[var(--surface)]">
              <p className="font-semibold text-[var(--text)]">{item.name}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {item.description || t("rentalHighlight")}
              </p>
              <p className="mt-3 text-[var(--text)] font-bold">
                {t("perDay", { price: formatCurrency(item.dailyRate, item.currency) })}
              </p>
              {item.weeklyRate ? (
                <p className="text-sm text-[var(--text-muted)]">
                  {t("weeklyRate", { price: formatCurrency(item.weeklyRate, item.currency) })}
                </p>
              ) : null}
              <WarmButton className="mt-4" onClick={() => selectRental(item)}>
                {t("select")}
              </WarmButton>
            </WarmCard>
          ))
        )}
      </div>

      {selection ? (
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{t("selectedHeading")}</h3>
          <p className="text-sm text-[var(--text-muted)]">{selection.name}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">{t("estimatedTotal")}</span>
            <span className="text-lg font-bold text-[var(--text)]">
              {formatCurrency(total, selection.currency)}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <label htmlFor="rental-notes" className="text-sm font-medium text-[var(--text)]">
              {t("notesLabel")}
            </label>
            <Input
              id="rental-notes"
              type="text"
              placeholder={t("notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <WarmButton className="w-full mt-4" onClick={submitBooking} disabled={isSubmitting}>
            {isSubmitting ? t("submitting") : t("requestBooking")}
          </WarmButton>
        </WarmCard>
      ) : null}

      {/* My Bookings Section */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t("myBookings")}</h2>
        {bookingsLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-3 border-[var(--primary)] border-t-transparent rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            {t("noBookings")}
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-[var(--border)] rounded-xl p-4 bg-white/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--text)] truncate">
                        {booking.rentalItem.name}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[booking.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {t("bookingRange", {
                        start: formatDate(booking.startDate),
                        end: formatDate(booking.endDate),
                        days: booking.days,
                      })}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      {t("bookingTotal", { total: formatCurrency(booking.totalPrice, booking.currency) })}
                    </p>
                    {booking.rejectionReason && (
                      <p className="text-sm text-red-600 mt-1">
                        {t("rejectionReason", { reason: booking.rejectionReason })}
                      </p>
                    )}
                  </div>
                  {(booking.status === "pending" || booking.status === "approved") && (
                    <WarmButton
                      variant="outline"
                      size="sm"
                      onClick={() => cancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                    >
                      {cancellingId === booking.id ? t("cancelling") : t("cancel")}
                    </WarmButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </WarmCard>
    </div>
  )
}
