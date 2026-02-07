import { motion } from 'motion/react';
import { Tag, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@app/components/ui/utils';

interface TickerItem {
  id: string;
  text: string;
  type: 'hot' | 'ending' | 'new';
  discount?: string;
}

const DUMMY_ITEMS: TickerItem[] = [
  { id: '1', text: "Restoran Ööbik - 3-käiguline õhtusöök", type: 'hot', discount: '-40%' },
  { id: '2', text: "Viimased 2 tundi: Grand Rose Spa Pakett", type: 'ending' },
  { id: '3', text: "Uus! Surfikoolitus Pärnus", type: 'new', discount: '-20%' },
  { id: '4', text: "Eksklusiivne: Veinidegusteerimine vanalinnas", type: 'hot', discount: '-30%' },
  { id: '5', text: "Ainult täna: Perepilet Loomaaeda", type: 'ending', discount: '-50%' },
];

export function CampaignTicker() {
  return (
    <div className="w-full bg-[#2D2721] text-[#E7DCC7] overflow-hidden py-3 border-b border-[#E17B5C]/30 relative z-20">
      <div className="flex whitespace-nowrap">
        {/* We need multiple copies for seamless infinite loop */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-12 mx-6"
            animate={{ x: "-100%" }}
            transition={{ 
              repeat: Infinity, 
              ease: "linear", 
              duration: 30, // Adjust speed here (higher = slower)
            }}
          >
            {DUMMY_ITEMS.map((item) => (
              <div key={`${i}-${item.id}`} className="flex items-center gap-2 text-sm font-medium tracking-wide">
                {item.type === 'hot' && <TrendingUp className="w-4 h-4 text-[#E17B5C]" />}
                {item.type === 'ending' && <Clock className="w-4 h-4 text-[#FFC857]" />}
                {item.type === 'new' && <Tag className="w-4 h-4 text-[#A8D5BA]" />}
                
                <span className="uppercase text-xs opacity-70 tracking-widest mr-1">
                  {item.type === 'hot' ? 'Populaarne' : item.type === 'ending' ? 'Lõppemas' : 'Uus'}
                </span>
                
                <span className="font-display font-semibold">{item.text}</span>
                
                {item.discount && (
                  <span className="bg-[#E17B5C] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.discount}
                  </span>
                )}
                
                <span className="text-[#E7DCC7]/20 ml-8 text-lg">•</span>
              </div>
            ))}
          </motion.div>
        ))}
      </div>
      
      {/* Gradients for fading effect on sides */}
      <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-[#2D2721] to-transparent z-10" />
      <div className="absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-[#2D2721] to-transparent z-10" />
    </div>
  );
}
