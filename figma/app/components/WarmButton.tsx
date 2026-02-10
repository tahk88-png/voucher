import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@app/components/ui/utils';
import { Loader2 } from 'lucide-react';

interface WarmButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'default';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const WarmButton = forwardRef<HTMLButtonElement, WarmButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, fullWidth, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold tracking-[0.01em] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-warm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFC857]/35 focus-visible:ring-offset-2';
    
    const variants = {
      primary: 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] border border-[#F3C76B] hover:shadow-warm-lg hover:scale-[1.015] active:scale-[0.99]',
      default: 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] border border-[#F3C76B] hover:shadow-warm-lg hover:scale-[1.015] active:scale-[0.99]',
      secondary: 'bg-white/95 text-[#2D2721] border-2 border-[rgba(139,115,85,0.18)] hover:border-[rgba(139,115,85,0.34)] hover:shadow-warm',
      outline: 'bg-white/75 text-[#2D2721] border-2 border-[#F2CB80] hover:bg-[#FFF9ED]',
      ghost: 'bg-transparent text-[#6B5744] hover:bg-[#F8F6F1]',
    };
    
    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-[14px]',
      md: 'px-6 py-3 text-base rounded-[16px]',
      lg: 'px-8 py-3.5 text-lg rounded-[20px]',
      icon: 'h-10 w-10 rounded-[14px] p-0',
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
