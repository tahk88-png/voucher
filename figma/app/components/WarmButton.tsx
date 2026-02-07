import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/figma/app/components/ui/utils';
import { Loader2 } from 'lucide-react';

interface WarmButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const WarmButton = forwardRef<HTMLButtonElement, WarmButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, fullWidth, children, disabled, ...props }, ref) => {
    const baseStyles =
      'relative inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-warm overflow-hidden ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFFBF5] ' +
      'active:translate-y-[1px] before:absolute before:inset-0 before:rounded-[inherit] before:bg-white/15 before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100';
    
    const variants = {
      primary: 'bg-gradient-to-br from-[#FFC857] via-[#FFC857] to-[#FFB627] text-[#2D2721] hover:shadow-warm-lg hover:-translate-y-0.5 active:translate-y-0',
      secondary: 'bg-white text-[#2D2721] border-2 border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-warm hover:-translate-y-0.5 active:translate-y-0',
      outline: 'bg-transparent text-[#2D2721] border-2 border-[#FFC857] hover:bg-[#FFF9ED] hover:-translate-y-0.5 active:translate-y-0',
      ghost: 'bg-transparent text-[#6B5744] hover:bg-[#F8F6F1] hover:-translate-y-0.5 active:translate-y-0',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-[12px]',
      md: 'px-6 py-3 text-base rounded-[16px]',
      lg: 'px-8 py-4 text-lg rounded-[20px]',
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

WarmButton.displayName = 'WarmButton';
