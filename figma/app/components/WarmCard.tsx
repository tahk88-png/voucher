import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@app/components/ui/utils';

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
          'rounded-[20px] shadow-warm',
          gradient ? 'bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4]' : 'bg-white',
          hover && 'transition-all duration-200 hover:shadow-warm-lg hover:scale-[1.01]',
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
