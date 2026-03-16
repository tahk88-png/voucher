"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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

export default function RentClient({
  merchantId,
  currency,
  rentals,
}: {
  merchantId: string
  currency: string
  rentals: RentalItem[]
}) {
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
      showError("Please select rental dates.")
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
        throw new Error(err.error || "Booking failed")
      }

      const data = await res.json()
      showSuccess(
        `Booking request created for ${data.booking.rentalItem?.name || selection.name}. Total: ${formatCurrency(data.booking.totalPrice, data.booking.currency)}.`,
        "Booking submitted"
      )
      setSelection(null)
      setNotes("")
      fetchBookings()
    } catch (error) {
      showError(error instanceof Error ? error.message : "Unable to create rental booking.")
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
        showSuccess("Booking cancelled.")
        fetchBookings()
      } else {
        const err = await res.json().catch(() => ({}))
        showError(err.error || "Failed to cancel booking.")
      }
    } catch {
      showError("Failed to cancel booking.")
    } finally {
      setCancellingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Rental dates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="rental-start-date" className="text-sm font-medium text-[var(--text)]">
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
            <label htmlFor="rental-end-date" className="text-sm font-medium text-[var(--text)]">
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
        <p className="text-sm text-[var(--text-muted)] mt-3">
          {days > 0 ? `${days} rental days selected.` : "Select dates to calculate pricing."}
        </p>
      </WarmCard>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rentals.length === 0 ? (
          <WarmCard padding="lg" className="bg-[var(--surface)] col-span-full text-center">
            <p className="text-[var(--text-muted)]">No rentals available yet.</p>
          </WarmCard>
        ) : (
          rentals.map((item) => (
            <WarmCard key={item.id} padding="lg" className="bg-[var(--surface)]">
              <p className="font-semibold text-[var(--text)]">{item.name}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {item.description || "Rental highlight"}
              </p>
              <p className="mt-3 text-[var(--text)] font-bold">
                {formatCurrency(item.dailyRate, item.currency)} / day
              </p>
              {item.weeklyRate ? (
                <p className="text-sm text-[var(--text-muted)]">
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
        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-2">Selected rental</h3>
          <p className="text-sm text-[var(--text-muted)]">{selection.name}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">Estimated total</span>
            <span className="text-lg font-bold text-[var(--text)]">
              {formatCurrency(total, selection.currency)}
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <label htmlFor="rental-notes" className="text-sm font-medium text-[var(--text)]">
              Notes (optional)
            </label>
            <Input
              id="rental-notes"
              type="text"
              placeholder="Any special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <WarmButton className="w-full mt-4" onClick={submitBooking} disabled={isSubmitting}>
            {isSubmitting ? "Submitting booking..." : "Request rental booking"}
          </WarmButton>
        </WarmCard>
      ) : null}

      {/* My Bookings Section */}
      <WarmCard padding="lg" className="bg-[var(--surface)]">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">My Bookings</h2>
        {bookingsLoading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin h-6 w-6 border-3 border-[var(--primary)] border-t-transparent rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            No rental bookings yet. Select an item above to get started.
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
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">
                      {formatDate(booking.startDate)} - {formatDate(booking.endDate)} ({booking.days} days)
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">
                      Total: {formatCurrency(booking.totalPrice, booking.currency)}
                    </p>
                    {booking.rejectionReason && (
                      <p className="text-sm text-red-600 mt-1">
                        Reason: {booking.rejectionReason}
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
                      {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
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
