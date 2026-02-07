import { useNavigate } from 'react-router-dom';
import { WarmCard } from '@/figma/app/components/WarmCard';
import { WarmButton } from '@/figma/app/components/WarmButton';
import { Home, Search, ArrowLeft, Gift } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9ED] via-[#FFFBF0] to-[#FFE5B4] flex items-center justify-center p-4">
      <WarmCard padding="xl" className="max-w-2xl w-full text-center">
        {/* 404 Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#FFE5B4] to-[#FFC857] flex items-center justify-center shadow-warm-lg">
            <div className="text-6xl font-bold text-white">404</div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <div className="px-4 py-1 bg-gradient-to-br from-[#E17B5C] to-[#D16B4C] rounded-full shadow-warm">
              <span className="text-xs font-semibold text-white">Page Not Found</span>
            </div>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-4">
          Oops! This page doesn't exist
        </h1>
        <p className="text-lg text-[#6B5744] mb-8 max-w-md mx-auto">
          The page you're looking for might have been moved, deleted, or never existed in the first place.
        </p>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <WarmButton size="lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </WarmButton>
          <WarmButton size="lg" variant="outline" onClick={() => navigate('/')}>
            <Home className="h-5 w-5 mr-2" />
            Home Page
          </WarmButton>
        </div>

        {/* Popular Links */}
        <div className="pt-6 border-t border-[rgba(139,115,85,0.1)]">
          <p className="text-sm font-semibold text-[#8B7355] mb-4">Popular Pages:</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/campaigns')}
              className="px-4 py-2 bg-[#FFF9ED] hover:bg-gradient-to-br hover:from-[#FFC857] hover:to-[#FFB627] hover:text-white rounded-full text-sm font-medium text-[#2D2721] transition-all"
            >
              <Search className="h-4 w-4 inline mr-1.5" />
              Explore Campaigns
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-[#FFF9ED] hover:bg-gradient-to-br hover:from-[#FFC857] hover:to-[#FFB627] hover:text-white rounded-full text-sm font-medium text-[#2D2721] transition-all"
            >
              <Gift className="h-4 w-4 inline mr-1.5" />
              Merchant Login
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-[#FFF9ED] hover:bg-gradient-to-br hover:from-[#FFC857] hover:to-[#FFB627] hover:text-white rounded-full text-sm font-medium text-[#2D2721] transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-[#FFC857]/20 rounded-full blur-2xl -z-10" />
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-[#9DB5A5]/20 rounded-full blur-2xl -z-10" />
      </WarmCard>
    </div>
  );
}
