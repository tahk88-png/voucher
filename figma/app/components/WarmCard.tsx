import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/figma/app/components/ui/utils';

interface WarmCardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const WarmCard = forwardRef<HTMLDivElement, WarmCardProps>(
  ({ className, gradient, hover, padding = 'md', children, ...props }, ref) => {
    const paddingStyles = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-[20px] shadow-warm border border-[#F2EDE3] overflow-hidden motion-safe:animate-fade-up',
          gradient ? 'bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]' : 'bg-white',
          hover && 'transition-all duration-200 hover:shadow-warm-lg hover:-translate-y-1',
          hover && 'before:absolute before:inset-x-0 before:top-0 before:h-20 before:bg-gradient-to-b before:from-white/70 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100',
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

WarmCard.displayName = 'WarmCard';
