import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement>;

export function ImageWithFallback({
  src,
  alt = '',
  className,
  style,
  loading = 'lazy',
  decoding = 'async',
  ...rest
}: ImageWithFallbackProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className={`relative overflow-hidden bg-[#F3EEE3] ${className ?? ''}`} style={style}>
      {status !== 'loaded' && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 ${status === 'error' ? 'bg-[#F8F6F1]' : 'animate-pulse bg-gradient-to-r from-[#F8F6F1] via-[#FFF9ED] to-[#F8F6F1]'}`}
        />
      )}

      {status === 'error' && (
        <div className="absolute inset-0 grid place-items-center text-[#8B7355]">
          <div className="flex flex-col items-center gap-2 text-xs font-semibold">
            <ImageOff className="h-6 w-6" />
            <span>Image unavailable</span>
          </div>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={`h-full w-full object-cover transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        {...rest}
      />
    </div>
  );
}
