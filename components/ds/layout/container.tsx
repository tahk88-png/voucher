import React, { type ReactNode } from 'react';

export interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  children: ReactNode;
  className?: string;
}

const sizeMap = {
  sm: 'max-w-screen-sm',   // 640px
  md: 'max-w-screen-md',   // 768px
  lg: 'max-w-screen-lg',   // 1024px
  xl: 'max-w-screen-xl',   // 1280px
  full: 'max-w-full',
} as const;

export function Container({
  size = 'xl',
  centered = true,
  children,
  className = '',
}: ContainerProps) {
  return (
    <div
      className={[
        'w-full px-4 sm:px-6 lg:px-8',
        sizeMap[size],
        centered ? 'mx-auto' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default Container;
