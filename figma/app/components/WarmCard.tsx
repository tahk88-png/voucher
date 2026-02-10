import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@app/components/ui/utils';

interface WarmCardProps extends HTMLAttributes<HTMLDivElement> {
  gradient?: boolean;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export const WarmCard = forwardRef<HTMLDivElement, WarmCardProps>(
  ({ className, gradient, hover, padding = 'md', children, ...props }, ref) => {
    const paddingStyles = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[24px] border border-[rgba(139,115,85,0.12)] backdrop-blur-sm shadow-warm',
          gradient ? 'bg-gradient-to-br from-[#FFF9ED]/95 to-[#FFE5B4]/95' : 'bg-white/95',
          hover && 'transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5',
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
