import { useState } from 'react';
import { Star, X, ThumbsUp } from 'lucide-react';
import { useAdminSettings } from '@app/contexts/AdminSettings';
import { WarmButton } from '@app/components/WarmButton';
import { toast } from 'sonner';

export function FeedbackWidget() {
  const { feedbackEnabled, chatEnabled } = useAdminSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!feedbackEnabled) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Palun vali hinne');
      return;
    }
    setSubmitted(true);
    toast.success('Aitah tagasiside eest!');
    
    // Auto close after success
    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setRating(0);
      setFeedback('');
    }, 2000);
  };

  // Keep feedback widget above chat when both are enabled.
  // This avoids overlapping floating buttons on small screens.
  const bottomPosition = chatEnabled ? 'bottom-24' : 'bottom-6';

  return (
    <div className={`fixed ${bottomPosition} left-6 z-40 transition-all duration-300`}>
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-xl border border-[#E7DCC7] w-72 p-5 animate-in fade-in slide-in-from-bottom-5">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-[#E6F4EA] rounded-full flex items-center justify-center mx-auto mb-3">
                <ThumbsUp className="w-6 h-6 text-[#00D098]" />
              </div>
              <h3 className="font-bold text-[#2D2721]">Aitah!</h3>
              <p className="text-sm text-[#6B5744]">Sinu arvamus on meile tahtis.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-[#2D2721]">Anna tagasisidet</h3>
                <button onClick={() => setIsOpen(false)} className="text-[#8B7355] hover:text-[#2D2721]">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star 
                      className={`w-8 h-8 ${rating >= star ? 'fill-[#FFC857] text-[#FFC857]' : 'text-[#E7DCC7]'}`} 
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Mis meeldis? Mis voiks parem olla?"
                className="w-full bg-[#FAF7F2] border-none rounded-xl p-3 text-sm mb-4 h-24 resize-none focus:ring-2 focus:ring-[#E17B5C] focus:outline-none"
              />

              <WarmButton fullWidth onClick={handleSubmit}>
                Saada
              </WarmButton>
            </>
          )}
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-white hover:bg-[#FAF7F2] text-[#2D2721] p-3 rounded-full shadow-lg border border-[#E7DCC7] transition-all hover:scale-110 flex items-center gap-2 group"
        >
          <Star className="w-5 h-5 text-[#FFC857]" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold">
            Hinda meid
          </span>
        </button>
      )}
    </div>
  );
}
