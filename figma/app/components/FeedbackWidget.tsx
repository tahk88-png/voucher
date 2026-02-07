import { useState } from 'react';
import { Star, X, Send, MessageSquare } from 'lucide-react';
import { WarmCard } from '@app/components/WarmCard';
import { WarmButton } from '@app/components/WarmButton';
import { useAdminSettings } from '@app/contexts/AdminSettings';
import { toast } from 'sonner';

export function FeedbackWidget() {
  const { feedbackEnabled } = useAdminSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Hide widget if user has submitted or if admin disabled it
  if (!feedbackEnabled || hasSubmitted) {
    return null;
  }

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Palun vali hinne');
      return;
    }

    // Simulate submission
    setHasSubmitted(true);
    toast.success('Täname tagasiside eest! 🙏');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-6 w-14 h-14 rounded-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] shadow-warm-lg hover:shadow-warm-xl transition-all flex items-center justify-center group z-50"
        aria-label="Give feedback"
      >
        <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 left-6 w-[360px] max-w-[calc(100vw-3rem)] z-50">
      <WarmCard padding="none" className="shadow-warm-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-br from-[#FFC857] to-[#FFB627] rounded-t-[16px]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-white">Tagasiside</div>
              <div className="text-xs text-white/80">Kuidas meile meeldib?</div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close feedback"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-[#FEFCF8] space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-[#2D2721] mb-3">
              Hinda oma kogemust
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                  aria-label={`Rate ${star} stars`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-[#FFC857] text-[#FFC857]'
                        : 'text-[#DDD5C8]'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-center mt-2 text-sm text-[#8B7355]">
                {rating === 5 && '🎉 Suurepärane!'}
                {rating === 4 && '😊 Väga hea!'}
                {rating === 3 && '👍 Hea!'}
                {rating === 2 && '😐 Võiks parem olla'}
                {rating === 1 && '😞 Vabandust, et pettumus'}
              </div>
            )}
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-sm font-semibold text-[#2D2721] mb-2">
              Jaga oma mõtteid (valikuline)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Mida saaksime parandada?"
              rows={4}
              className="w-full px-4 py-3 rounded-[12px] border border-[rgba(139,115,85,0.2)] focus:border-[#FFC857] focus:outline-none focus:ring-2 focus:ring-[#FFC857]/20 transition-all resize-none text-sm text-[#2D2721] placeholder:text-[#B5A391]"
            />
          </div>

          {/* Submit Button */}
          <WarmButton onClick={handleSubmit} className="w-full" size="lg">
            <Send className="h-4 w-4 mr-2" />
            Saada tagasiside
          </WarmButton>

          {/* Privacy Note */}
          <div className="text-xs text-[#8B7355] text-center">
            Sinu tagasiside aitab meil paremaks saada 💚
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
