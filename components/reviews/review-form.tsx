'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { StarRating } from './star-rating';

interface ReviewFormProps {
  merchantId?: string;
  voucherId?: string;
  campaignId?: string;
  onSubmit?: () => void;
}

export function ReviewForm({ merchantId, voucherId, campaignId, onSubmit }: ReviewFormProps) {
  const t = useTranslations('reviews.form');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError(t('ratingRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          voucherId,
          campaignId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        // The API's error text is English; show our own message for its status.
        setError(
          res.status === 409
            ? t('alreadyReviewed')
            : res.status === 401
              ? t('signInRequired')
              : t('submitFailed')
        );
        return;
      }

      setSuccess(true);
      setRating(0);
      setTitle('');
      setComment('');
      onSubmit?.();
    } catch {
      setError(t('submitFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <p className="text-lg font-medium" style={{ color: 'var(--text)' }}>
          {t('thankYou')}
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-3 text-sm underline"
          style={{ color: 'var(--primary)' }}
        >
          {t('writeAnother')}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-6 space-y-4"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
        {t('title')}
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          {t('ratingLabel')}
        </label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          {t('titleLabel')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder={t('titlePlaceholder')}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          {t('commentLabel')}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder={t('commentPlaceholder')}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none"
          style={{
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-foreground)',
        }}
      >
        {loading ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
