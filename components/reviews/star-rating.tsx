'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeMap = {
  sm: 14,
  md: 20,
  lg: 28,
};

export function StarRating({
  rating,
  size = 'md',
  showCount,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const iconSize = sizeMap[size];
  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayRating >= star;
        const halfFilled = !filled && displayRating >= star - 0.5;

        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`relative ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} disabled:opacity-100`}
            onClick={() => interactive && onChange?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            {halfFilled ? (
              <div className="relative" style={{ width: iconSize, height: iconSize }}>
                <Star
                  size={iconSize}
                  className="absolute inset-0"
                  style={{ color: 'var(--muted)' }}
                  strokeWidth={1.5}
                />
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star
                    size={iconSize}
                    style={{ color: 'var(--primary)', fill: 'var(--primary)' }}
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            ) : (
              <Star
                size={iconSize}
                style={{
                  color: filled ? 'var(--primary)' : 'var(--muted)',
                  fill: filled ? 'var(--primary)' : 'transparent',
                }}
                strokeWidth={1.5}
              />
            )}
          </button>
        );
      })}
      {showCount !== undefined && (
        <span
          className="ml-1.5 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          ({showCount})
        </span>
      )}
    </div>
  );
}
