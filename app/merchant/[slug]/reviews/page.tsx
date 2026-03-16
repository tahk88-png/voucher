'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess } from '@/lib/toast-helpers';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquare,
  Send,
  Filter,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  verified: boolean;
  status: string;
  merchantReply: string | null;
  merchantReplyAt: string | null;
  helpful: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  voucher: { id: string; codePrefix: string | null } | null;
  campaign: { id: string; name: string } | null;
}

interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  distribution: Record<number, number>;
  repliedCount: number;
  unrepliedCount: number;
}

interface ReviewsResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  stats: ReviewStats;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function RatingBar({ rating, count, total }: { rating: number; count: number; total: number }) {
  const percent = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-right text-[var(--text-muted)]">{rating}</span>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-[var(--text-muted)]">{count}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [replyFilter, setReplyFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (ratingFilter) params.set('rating', ratingFilter);
    if (replyFilter) params.set('hasReply', replyFilter);

    fetch(`/api/merchant/${slug}/reviews?${params}`)
      .then((res) => res.json())
      .then(setData)
      .catch(() => showError('Failed to load reviews'))
      .finally(() => setLoading(false));
  }, [slug, page, ratingFilter, replyFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to reply');
      }
      const updated = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((r) => (r.id === reviewId ? updated : r)),
              stats: {
                ...prev.stats,
                repliedCount: prev.stats.repliedCount + 1,
                unrepliedCount: prev.stats.unrepliedCount - 1,
              },
            }
          : prev
      );
      setReplyingTo(null);
      setReplyText('');
      showSuccess('Reply posted');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to reply');
    } finally {
      setSubmitting(false);
    }
  };

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">Reviews</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Monitor and respond to customer reviews
          </p>
        </div>
        <WarmButton
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-1" /> Filters
        </WarmButton>
      </div>

      {/* Stats Overview */}
      {stats && stats.totalReviews > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WarmCard padding="lg" className="bg-white text-center">
            <p className="text-4xl font-bold text-[var(--text)]">{stats.avgRating}</p>
            <StarRating rating={Math.round(stats.avgRating)} size="lg" />
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </WarmCard>

          <WarmCard padding="lg" className="bg-white">
            <p className="text-sm font-medium text-[var(--text)] mb-3">Rating Distribution</p>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => (
                <RatingBar
                  key={r}
                  rating={r}
                  count={stats.distribution[r] || 0}
                  total={stats.totalReviews}
                />
              ))}
            </div>
          </WarmCard>

          <WarmCard padding="lg" className="bg-white">
            <p className="text-sm font-medium text-[var(--text)] mb-3">Response Rate</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.repliedCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Replied</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{stats.unrepliedCount}</p>
                <p className="text-xs text-[var(--text-muted)]">Pending</p>
              </div>
            </div>
            {stats.totalReviews > 0 && (
              <p className="text-center text-sm text-[var(--text-muted)] mt-2">
                {Math.round((stats.repliedCount / stats.totalReviews) * 100)}% response rate
              </p>
            )}
          </WarmCard>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <WarmCard padding="lg" className="bg-white">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Rating</label>
              <select
                className="block h-9 rounded-md border border-[var(--border)] bg-white px-3 text-sm mt-1"
                value={ratingFilter}
                onChange={(e) => {
                  setRatingFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All ratings</option>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} Star{r !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)]">Reply Status</label>
              <select
                className="block h-9 rounded-md border border-[var(--border)] bg-white px-3 text-sm mt-1"
                value={replyFilter}
                onChange={(e) => {
                  setReplyFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All</option>
                <option value="false">Needs reply</option>
                <option value="true">Replied</option>
              </select>
            </div>
            <div className="flex items-end">
              <WarmButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setRatingFilter('');
                  setReplyFilter('');
                  setPage(1);
                }}
              >
                Clear
              </WarmButton>
            </div>
          </div>
        </WarmCard>
      )}

      {/* Reviews List */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading reviews...</p>
      ) : !data || data.items.length === 0 ? (
        <WarmCard padding="lg" className="bg-white text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-muted)]">No reviews found.</p>
        </WarmCard>
      ) : (
        <>
          <div className="space-y-4">
            {data.items.map((review) => (
              <WarmCard key={review.id} padding="lg" className="bg-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Review header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                        {(review.user.name || review.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[var(--text)]">
                          {review.user.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StarRating rating={review.rating} />
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Review content */}
                    {review.title && (
                      <p className="font-medium text-[var(--text)] mb-1">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="text-sm text-[var(--text-muted)] mb-2">{review.comment}</p>
                    )}

                    {/* Context */}
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      {review.campaign && (
                        <Badge variant="outline" className="text-xs">
                          Campaign: {review.campaign.name}
                        </Badge>
                      )}
                      {review.voucher?.codePrefix && (
                        <Badge variant="outline" className="text-xs">
                          Voucher: {review.voucher.codePrefix}
                        </Badge>
                      )}
                      {review.helpful > 0 && (
                        <span>{review.helpful} found helpful</span>
                      )}
                    </div>

                    {/* Merchant Reply */}
                    {review.merchantReply && (
                      <div className="mt-3 pl-4 border-l-2 border-[var(--primary)] bg-[var(--surface)] rounded-r p-3">
                        <p className="text-xs font-medium text-[var(--text)] mb-1">Your reply</p>
                        <p className="text-sm text-[var(--text-muted)]">{review.merchantReply}</p>
                        {review.merchantReplyAt && (
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {new Date(review.merchantReplyAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Reply form */}
                    {replyingTo === review.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm min-h-[80px] resize-y"
                          placeholder="Write your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          maxLength={2000}
                        />
                        <div className="flex items-center gap-2">
                          <WarmButton
                            size="sm"
                            onClick={() => handleReply(review.id)}
                            disabled={submitting || !replyText.trim()}
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            {submitting ? 'Posting...' : 'Post Reply'}
                          </WarmButton>
                          <WarmButton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                          >
                            Cancel
                          </WarmButton>
                          <span className="text-xs text-[var(--text-muted)] ml-auto">
                            {replyText.length}/2000
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reply button */}
                  {!review.merchantReply && replyingTo !== review.id && (
                    <WarmButton
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(review.id);
                        setReplyText('');
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Reply
                    </WarmButton>
                  )}
                </div>
              </WarmCard>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              Showing {(data.page - 1) * data.pageSize + 1}–
              {Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <WarmButton
                size="sm"
                variant="outline"
                disabled={!data.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </WarmButton>
              <span className="text-sm text-[var(--text-muted)]">
                Page {data.page} of {data.totalPages}
              </span>
              <WarmButton
                size="sm"
                variant="outline"
                disabled={!data.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </WarmButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
