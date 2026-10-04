'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { StarRating } from './star-rating';
import { ReviewForm } from './review-form';
import { ThumbsUp } from 'lucide-react';

interface ReviewUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface ReviewVote {
  id: string;
  userId: string;
  helpful: boolean;
}

interface Review {
  id: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  helpful: number;
  verified: boolean;
  createdAt: string;
  user: ReviewUser;
  votes: ReviewVote[];
}

interface ReviewListProps {
  merchantId?: string;
  voucherId?: string;
  campaignId?: string;
  /** Whether the visitor is signed in. Writing and voting need an account. */
  signedIn: boolean;
}

type SortOption = 'newest' | 'highest' | 'helpful';

export function ReviewList({ merchantId, voucherId, campaignId, signedIn }: ReviewListProps) {
  const pathname = usePathname();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [sort, setSort] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    try {
      const params = new URLSearchParams();
      if (merchantId) params.set('merchantId', merchantId);
      if (voucherId) params.set('voucherId', voucherId);
      if (campaignId) params.set('campaignId', campaignId);
      params.set('sort', sort);
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const res = await fetch(`/api/reviews?${params}`);
      if (!res.ok) throw new Error('Failed to fetch reviews');

      const data = await res.json();
      setReviews(data.reviews);
      setTotal(data.total);
      setAvgRating(data.avgRating);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, [merchantId, voucherId, campaignId, sort, offset]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  async function handleVote(reviewId: string, helpful: boolean) {
    try {
      await fetch(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpful }),
      });
      fetchReviews();
    } catch {
      // silent
    }
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      {/* Summary and sorting only mean something once there are reviews;
          "0.0" with sort buttons over an empty list read as a bad rating. */}
      {total > 0 && (
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <StarRating rating={avgRating} size="lg" showCount={total} />
          <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {avgRating.toFixed(1)}
          </span>
        </div>

        <div className="flex gap-1">
          {(['newest', 'highest', 'helpful'] as SortOption[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={sort === s}
              onClick={() => { setSort(s); setOffset(0); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: sort === s ? 'var(--primary)' : 'var(--surface)',
                color: sort === s ? 'var(--primary-foreground)' : 'var(--text-muted)',
                border: sort === s ? 'none' : '1px solid var(--border)',
              }}
            >
              {s === 'newest' ? 'Newest' : s === 'highest' ? 'Highest' : 'Most Helpful'}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Review Form — signed-out visitors used to get the form and then an
          "Unauthorized" error on submit. */}
      {signedIn ? (
        <ReviewForm
          merchantId={merchantId}
          voucherId={voucherId}
          campaignId={campaignId}
          onSubmit={fetchReviews}
        />
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`}
            className="font-medium underline underline-offset-2"
            style={{ color: 'var(--primary)' }}
          >
            Sign in to write a review
          </Link>
        </p>
      )}

      {/* Reviews */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 animate-pulse"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="h-4 w-1/3 rounded" style={{ backgroundColor: 'var(--muted)' }} />
              <div className="mt-3 h-3 w-2/3 rounded" style={{ backgroundColor: 'var(--muted)' }} />
            </div>
          ))}
        </div>
      ) : loadFailed ? (
        <div
          role="alert"
          className="rounded-xl p-6 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p style={{ color: 'var(--text-muted)' }}>Reviews couldn&apos;t be loaded.</p>
          <button
            type="button"
            onClick={fetchReviews}
            className="mt-2 text-sm font-medium underline underline-offset-2"
            style={{ color: 'var(--primary)' }}
          >
            Try again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {review.user.image ? (
                    <Image
                      src={review.user.image}
                      alt=""
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: 'var(--muted)', color: 'var(--text-muted)' }}
                    >
                      {(review.user.name || '?')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {review.user.name || 'Anonymous'}
                      {review.verified && (
                        <span
                          className="ml-2 text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                          Verified
                        </span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {new Date(review.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>

              {review.title && (
                <h4 className="mt-3 font-medium" style={{ color: 'var(--text)' }}>
                  {review.title}
                </h4>
              )}

              {review.comment && (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {review.comment}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                {signedIn ? (
                <button
                  type="button"
                  onClick={() => handleVote(review.id, true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <ThumbsUp size={13} aria-hidden="true" />
                  Helpful ({review.helpful})
                </button>
                ) : review.helpful > 0 ? (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {review.helpful} found this helpful
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-3 py-1.5 rounded-lg text-sm transition-opacity disabled:opacity-30"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 rounded-lg text-sm transition-opacity disabled:opacity-30"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
