import { useState, useEffect } from 'react';
import { X, Share, Plus, Home } from 'lucide-react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already installed (running as PWA)
    const standalone = (window.navigator as any).standalone === true || 
                       window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Show prompt if iOS and not already installed
    // Also check if user has dismissed it before (using localStorage)
    const hasBeenDismissed = localStorage.getItem('ios-install-prompt-dismissed');
    
    if (iOS && !standalone && !hasBeenDismissed) {
      // Wait 3 seconds before showing the prompt
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
  };

  const handleLater = () => {
    setShowPrompt(false);
    // Don't save to localStorage so it shows again next time
  };

  if (!showPrompt || !isIOS || isStandalone) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md mb-safe">
        <WarmCard padding="lg" className="relative shadow-2xl border-2 border-[#FFC857]">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF9ED] hover:bg-[#FFE5B4] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-[#6B5744]" />
          </button>

          <div className="space-y-4">
            {/* Icon */}
            <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mx-auto shadow-warm">
              <Home className="h-8 w-8 text-white" />
            </div>

            {/* Title */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-[#2D2721] mb-2">
                Install GiftHub Scanner
              </h3>
              <p className="text-[#6B5744]">
                Add this app to your home screen for quick access and a better experience
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-[12px] p-4 space-y-3">
              <p className="text-sm font-semibold text-[#2D2721] mb-3">
                Installation steps:
              </p>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm font-bold text-[#FFC857]">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#6B5744]">
                    Tap the <strong>Share button</strong> <Share className="inline h-4 w-4 text-[#007AFF]" /> in your Safari toolbar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm font-bold text-[#FFC857]">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#6B5744]">
                    Scroll down and tap <strong>"Add to Home Screen"</strong> <Plus className="inline h-4 w-4" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-sm font-bold text-[#FFC857]">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#6B5744]">
                    Tap <strong>"Add"</strong> in the top right corner
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide">
                Benefits:
              </p>
              <ul className="space-y-1.5 text-sm text-[#6B5744]">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFC857]" />
                  Faster camera access for QR scanning
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFC857]" />
                  Works offline with cached data
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFC857]" />
                  Full-screen experience without browser UI
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFC857]" />
                  Quick access from your home screen
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <WarmButton
                variant="outline"
                className="flex-1"
                onClick={handleLater}
              >
                Maybe Later
              </WarmButton>
              <WarmButton
                className="flex-1"
                onClick={handleDismiss}
              >
                Got It!
              </WarmButton>
            </div>
          </div>
        </WarmCard>
      </div>

      {/* Safe area padding for iOS */}
      <style>{`
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .mb-safe {
            margin-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>
    </div>
  );
}
