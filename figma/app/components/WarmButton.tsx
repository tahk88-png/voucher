import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@app/components/ui/utils';
import { Loader2 } from 'lucide-react';

interface WarmButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const WarmButton = forwardRef<HTMLButtonElement, WarmButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, fullWidth, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-warm';
    
    const variants = {
      primary: 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-[#2D2721] hover:shadow-warm-lg hover:scale-[1.02] active:scale-[0.98]',
      secondary: 'bg-white text-[#2D2721] border-2 border-[rgba(139,115,85,0.15)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-warm',
      outline: 'bg-transparent text-[#2D2721] border-2 border-[#FFC857] hover:bg-[#FFF9ED]',
      ghost: 'bg-transparent text-[#6B5744] hover:bg-[#F8F6F1]',
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
