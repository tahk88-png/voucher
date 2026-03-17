'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

type AnimationType = 'fade' | 'scale' | 'slide-up' | 'slide-right' | 'slide-down';

interface AnimatedPresenceProps {
  show: boolean;
  animation?: AnimationType;
  duration?: number;
  className?: string;
  onExitComplete?: () => void;
  children: ReactNode;
}

const enterClasses: Record<AnimationType, string> = {
  fade: 'ds-animate-fade-in',
  scale: 'ds-animate-scale-in',
  'slide-up': 'ds-animate-fade-in-up',
  'slide-right': 'ds-animate-slide-in-right',
  'slide-down': 'ds-animate-fade-in-down',
};

const exitClasses: Record<AnimationType, string> = {
  fade: 'ds-animate-fade-out',
  scale: 'ds-animate-scale-out',
  'slide-up': 'ds-animate-fade-out-up',
  'slide-right': 'ds-animate-slide-out-right',
  'slide-down': 'ds-animate-fade-out-down',
};

export function AnimatedPresence({
  show,
  animation = 'fade',
  duration,
  className = '',
  onExitComplete,
  children,
}: AnimatedPresenceProps) {
  const [mounted, setMounted] = useState(show);
  const [animating, setAnimating] = useState<'enter' | 'exit' | null>(
    show ? 'enter' : null
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      setAnimating('enter');
    } else if (mounted) {
      setAnimating('exit');
    }
  }, [show, mounted]);

  const handleAnimationEnd = useCallback(() => {
    if (animating === 'exit') {
      setMounted(false);
      setAnimating(null);
      onExitComplete?.();
    } else if (animating === 'enter') {
      setAnimating(null);
    }
  }, [animating, onExitComplete]);

  if (!mounted) return null;

  const animClass =
    animating === 'enter'
      ? enterClasses[animation]
      : animating === 'exit'
        ? exitClasses[animation]
        : '';

  const style = duration ? { animationDuration: `${duration}ms` } : undefined;

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`.trim()}
      style={style}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
}
