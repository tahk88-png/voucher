import { useState } from 'react';
import { X, Copy, Check, Facebook, Twitter, Linkedin, Mail, MessageCircle } from 'lucide-react';
import { WarmCard } from './WarmCard';
import { WarmButton } from './WarmButton';
import { toast } from 'sonner';
import { copyToClipboard } from '@/app/utils/clipboard';

type ShareModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  url: string;
};

export function ShareModal({ isOpen, onClose, title, description, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'from-[#25D366] to-[#128C7E]',
      url: `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${description}\n\n${url}`)}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'from-[#1877F2] to-[#0C63D4]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'from-[#1DA1F2] to-[#0C85D0]',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'from-[#0A66C2] to-[#004182]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'from-[#EA4335] to-[#C5221F]',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`,
    },
  ];

  const handleShare = (shareUrl: string) => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md mx-4 mb-4 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <WarmCard padding="lg" className="relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FFF9ED] hover:bg-[#FFE5B4] flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-[#6B5744]" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-[#2D2721] mb-2">
              Share Campaign
            </h3>
            <p className="text-[#6B5744] text-sm line-clamp-2">
              {title}
            </p>
          </div>

          {/* Copy Link */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#6B5744] mb-2">
              Campaign Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-4 py-2.5 bg-[#FFF9ED] border border-[rgba(139,115,85,0.2)] rounded-lg text-sm text-[#2D2721] focus:outline-none focus:ring-2 focus:ring-[#FFC857]"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  copied
                    ? 'bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] text-white'
                    : 'bg-gradient-to-br from-[#FFC857] to-[#FFB627] text-white hover:shadow-warm'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Options */}
          <div>
            <label className="block text-sm font-semibold text-[#6B5744] mb-3">
              Share via
            </label>
            <div className="grid grid-cols-5 gap-3">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.name}
                    onClick={() => handleShare(option.url)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-[#FFF9ED] transition-colors group"
                    title={option.name}
                  >
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs text-[#6B5744] font-medium">
                      {option.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-[rgba(139,115,85,0.1)]">
            <WarmButton
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Close
            </WarmButton>
          </div>
        </WarmCard>
      </div>
    </div>
  );
}