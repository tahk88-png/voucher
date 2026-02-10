import { Gift } from 'lucide-react';
import { cn } from '@/figma/app/components/ui/utils';
import { Link } from '@/lib/router-shim';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export function Logo({ className, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'dark' ? 'text-[#2D2721]' : 'text-white';

  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      <div className="relative">
        <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-[#FFC857]/60 to-[#E17B5C]/60 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        <div
          className={cn(
            "relative w-9 h-9 rounded-xl flex items-center justify-center transform group-hover:rotate-6 transition-transform duration-300",
            "bg-gradient-to-br from-[#FFC857] via-[#FFB627] to-[#E17B5C] shadow-warm"
          )}
        >
          <Gift className="w-5 h-5 text-white drop-shadow-sm" />
        </div>
      </div>
      <span
        className={cn(
          "font-display font-bold text-xl tracking-tight",
          textColor
        )}
      >
        GiftHub
      </span>
    </Link>
  );
}

