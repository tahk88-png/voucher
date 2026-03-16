'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Booking {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  days: number;
  dailyRate: number;
  totalPrice: number;
  currency: string;
  status: string;
  notes: string | null;
  rejectionReason: string | null;
  approvedAt: string | null;
  returnedAt: string | null;
  createdAt: string;
  rentalItem: { id: string; name: string; imageUrl: string | null };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  active: 'bg-emerald-100 text-emerald-800',
  returned: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

const STATUSES = ['all', 'pending', 'approved', 'rejected', 'paid', 'active', 'returned', 'cancelled'];

export default function MerchantRentalsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchBookings = () => {
    const qs = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    fetch(`/api/merchant/${slug}/rentals${qs}`)
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data.bookings) ? data.bookings : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    fetchBookings();
  }, [slug, statusFilter]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/merchant/${slug}/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/merchant/${slug}/rentals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejectionReason: rejectReason }),
      });
      if (res.ok) {
        setRejectId(null);
        setRejectReason('');
        fetchBookings();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReturned = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/merchant/${slug}/rentals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_returned' }),
      });
      if (res.ok) fetchBookings();
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (cents: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${currency}`;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-[#2D2721]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2721]">Rental Bookings</h1>
            <p className="text-[#6b5e52]">Manage rental requests and returns</p>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === s
                  ? 'bg-[#FFC857] text-[#2D2721] shadow-sm'
                  : 'bg-white text-[#6b5e52] border border-[#e8e0d8] hover:bg-[#faf8f5]'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#FFC857] border-t-transparent rounded-full" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e8e0d8]">
            <p className="text-[#6b5e52]">No rental bookings found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl border border-[#e8e0d8] p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-[#2D2721] truncate">
                        {booking.rentalItem.name}
                      </h3>
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <div className="text-sm text-[#6b5e52] space-y-0.5">
                      <p>
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)} ({booking.days} days)
                      </p>
                      <p>
                        Total: <span className="font-semibold text-[#b8860b]">{formatPrice(booking.totalPrice, booking.currency)}</span>
                        {' '}({formatPrice(booking.dailyRate, booking.currency)}/day)
                      </p>
                      {booking.notes && (
                        <p className="text-[#8a7e74]">Note: {booking.notes}</p>
                      )}
                      {booking.rejectionReason && (
                        <p className="text-red-600">Rejected: {booking.rejectionReason}</p>
                      )}
                      <p className="text-xs text-[#a89e94]">
                        Booked: {formatDate(booking.createdAt)} | User: {booking.userId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-xl text-sm transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                        {rejectId === booking.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Reason (optional)"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="border border-[#e8e0d8] rounded-xl px-3 py-2 text-sm bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#FFC857] w-40"
                            />
                            <button
                              onClick={() => handleReject(booking.id)}
                              disabled={actionLoading === booking.id}
                              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-xl text-sm transition disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => { setRejectId(null); setRejectReason(''); }}
                              className="text-[#6b5e52] hover:text-[#2D2721] text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRejectId(booking.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-xl text-sm transition"
                          >
                            Reject
                          </button>
                        )}
                      </>
                    )}
                    {(booking.status === 'active' || booking.status === 'paid') && (
                      <button
                        onClick={() => handleMarkReturned(booking.id)}
                        disabled={actionLoading === booking.id}
                        className="bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721] font-semibold py-2 px-4 rounded-xl text-sm shadow-md hover:opacity-90 transition disabled:opacity-50"
                      >
                        Mark Returned
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
