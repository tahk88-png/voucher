import { motion } from 'motion/react';
import { ArrowRight, Star, Heart } from 'lucide-react';
import { WarmButton } from './WarmButton';
import { ImageWithFallback } from './figma/ImageWithFallback';

import { Link } from 'react-router-dom';

interface CampaignProps {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice: number;
  category: string;
  rating: number;
  featured?: boolean;
}

export function CampaignCard({ id, title, image, price, originalPrice, category, rating, featured }: CampaignProps) {
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`group relative bg-white rounded-2xl overflow-hidden border border-[#E7DCC7] shadow-sm hover:shadow-warm-lg transition-all duration-300 ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <Link to={`/campaign/${id}`} className="block h-full">
        {/* Image Container */}
        <div className={`relative ${featured ? 'h-64 md:h-full' : 'h-48'} overflow-hidden`}>
        <ImageWithFallback 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2D2721]/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-[#2D2721] uppercase tracking-wider">
            {category}
          </span>
          {featured && (
            <span className="bg-[#E17B5C] text-white px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" /> Featured
            </span>
          )}
        </div>

        <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-colors text-white">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col justify-between h-auto min-h-[160px]">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-display font-bold text-[#2D2721] ${featured ? 'text-2xl' : 'text-lg'} leading-tight group-hover:text-[#E17B5C] transition-colors`}>
              {title}
            </h3>
            <div className="flex items-center gap-1 text-[#FFC857]">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold text-[#2D2721]">{rating}</span>
            </div>
          </div>
          
          {featured && (
            <p className="text-[#6B5744] mb-4 line-clamp-2">
              Kogege unustamatut elamust meie hoolikalt valitud partnerite juures. Parim kvaliteet garanteeritud.
            </p>
          )}
        </div>

        <div className="flex items-end justify-between mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-[#8B7355] line-through mb-0.5">{originalPrice}€</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#2D2721]">{price}€</span>
              <span className="bg-[#FFF9ED] text-[#E17B5C] text-xs font-bold px-1.5 py-0.5 rounded border border-[#E17B5C]/20">
                -{discount}%
              </span>
            </div>
          </div>

          <WarmButton size="sm" className={featured ? "" : "opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0"}>
            Vaata <ArrowRight className="w-4 h-4 ml-1" />
          </WarmButton>
        </div>
      </div>
      </Link>
    </motion.div>
  );
}
