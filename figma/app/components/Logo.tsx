import { Gift } from 'lucide-react';
import { cn } from '@/figma/app/components/ui/utils';
import { Link } from 'react-router';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export function Logo({ className, variant = 'dark' }: LogoProps) {
  const textColor = variant === 'dark' ? 'text-[#2D2721]' : 'text-white';

  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300",
        "bg-gradient-to-br from-[#FFC857] to-[#FFB627] shadow-warm"
      )}>
        <Gift className="w-5 h-5 text-white" />
      </div>
      <span className={cn("font-display font-bold text-xl", textColor)}>GiftHub</span>
    </Link>
  );
}
