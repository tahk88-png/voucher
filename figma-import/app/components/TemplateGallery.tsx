import { useState } from 'react';
import { WarmCard } from '@/app/components/WarmCard';
import { WarmButton } from '@/app/components/WarmButton';
import { Check, Image as ImageIcon, Sparkles } from 'lucide-react';

export interface Template {
  id: string;
  name: string;
  category: 'minimal' | 'elegant' | 'modern' | 'classic' | 'creative';
  preview: (imageSrc?: string) => JSX.Element;
}

interface TemplateGalleryProps {
  selectedTemplateId?: string;
  onSelectTemplate: (template: Template) => void;
  defaultImage?: string;
}

export function TemplateGallery({ selectedTemplateId, onSelectTemplate, defaultImage }: TemplateGalleryProps) {
  const [filter, setFilter] = useState<'all' | Template['category']>('all');

  const templates: Template[] = [
    // MINIMAL TEMPLATES (1-6)
    {
      id: 'minimal-01',
      name: 'Clean Simple',
      category: 'minimal',
      preview: (img) => (
        <div className="w-full h-full bg-white p-6 flex flex-col">
          <div className="flex-1 flex items-center justify-center mb-4">
            {img ? (
              <img src={img} alt="" className="w-full h-32 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-gray-300" />
              </div>
            )}
          </div>
          <div className="h-16 bg-gray-100 rounded-lg mb-2" />
          <div className="h-8 bg-gray-50 rounded" />
        </div>
      ),
    },
    {
      id: 'minimal-02',
      name: 'Side Image',
      category: 'minimal',
      preview: (img) => (
        <div className="w-full h-full bg-white flex">
          {img ? (
            <img src={img} alt="" className="w-1/3 object-cover" />
          ) : (
            <div className="w-1/3 bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
          <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="h-12 bg-gray-100 rounded-lg mb-2" />
            <div className="h-6 bg-gray-50 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'minimal-03',
      name: 'Top Banner',
      category: 'minimal',
      preview: (img) => (
        <div className="w-full h-full bg-white flex flex-col">
          {img ? (
            <img src={img} alt="" className="w-full h-1/2 object-cover" />
          ) : (
            <div className="w-full h-1/2 bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
          <div className="flex-1 p-4 flex flex-col justify-center">
            <div className="h-10 bg-gray-100 rounded-lg mb-2" />
            <div className="h-6 bg-gray-50 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'minimal-04',
      name: 'Centered',
      category: 'minimal',
      preview: (img) => (
        <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center">
          {img ? (
            <img src={img} alt="" className="w-20 h-20 object-cover rounded-full mb-4" />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-6 w-6 text-gray-300" />
            </div>
          )}
          <div className="h-12 w-full bg-gray-100 rounded-lg mb-2" />
          <div className="h-6 w-2/3 bg-gray-50 rounded" />
        </div>
      ),
    },
    {
      id: 'minimal-05',
      name: 'Corner Image',
      category: 'minimal',
      preview: (img) => (
        <div className="w-full h-full bg-white p-4 relative">
          {img ? (
            <img src={img} alt="" className="absolute top-4 right-4 w-16 h-16 object-cover rounded-lg" />
          ) : (
            <div className="absolute top-4 right-4 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-300" />
            </div>
          )}
          <div className="h-12 w-2/3 bg-gray-100 rounded-lg mb-3" />
          <div className="h-6 w-1/2 bg-gray-50 rounded" />
        </div>
      ),
    },
    {
      id: 'minimal-06',
      name: 'Split View',
      category: 'minimal',
      preview: (img) => (
        <div className="w-full h-full bg-white flex flex-col">
          <div className="h-1/3 p-4">
            <div className="h-10 bg-gray-100 rounded-lg mb-2" />
            <div className="h-6 bg-gray-50 rounded" />
          </div>
          {img ? (
            <img src={img} alt="" className="flex-1 object-cover" />
          ) : (
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-300" />
            </div>
          )}
        </div>
      ),
    },

    // ELEGANT TEMPLATES (7-12)
    {
      id: 'elegant-01',
      name: 'Golden Frame',
      category: 'elegant',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] p-4">
          <div className="w-full h-full border-2 border-[#C8A882] rounded-lg p-4 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-24 object-cover rounded mb-3" />
            ) : (
              <div className="w-full h-24 bg-white/50 rounded mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-[#C8A882]" />
              </div>
            )}
            <div className="h-10 bg-white/70 rounded-lg mb-2" />
            <div className="h-6 bg-white/50 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'elegant-02',
      name: 'Luxury Badge',
      category: 'elegant',
      preview: (img) => (
        <div className="w-full h-full bg-[#2D2721] p-6 flex flex-col items-center justify-center relative">
          <div className="absolute top-3 right-3 w-12 h-12 bg-[#FFC857] rounded-full" />
          {img ? (
            <img src={img} alt="" className="w-16 h-16 object-cover rounded-full border-2 border-[#FFC857] mb-4" />
          ) : (
            <div className="w-16 h-16 bg-gray-700 rounded-full border-2 border-[#FFC857] mb-4 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-gray-500" />
            </div>
          )}
          <div className="h-10 w-full bg-gray-700 rounded-lg mb-2" />
          <div className="h-6 w-2/3 bg-gray-800 rounded" />
        </div>
      ),
    },
    {
      id: 'elegant-03',
      name: 'Soft Gradient',
      category: 'elegant',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] p-4">
          <div className="w-full h-full bg-white/90 backdrop-blur rounded-lg p-4 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-20 object-cover rounded-lg mb-3 shadow-lg" />
            ) : (
              <div className="w-full h-20 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-300" />
              </div>
            )}
            <div className="h-10 bg-gray-100 rounded-lg mb-2" />
            <div className="h-6 bg-gray-50 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'elegant-04',
      name: 'Pearl Card',
      category: 'elegant',
      preview: (img) => (
        <div className="w-full h-full bg-white p-4">
          <div className="w-full h-full border border-[#E8A87C] rounded-2xl p-4 shadow-lg flex flex-col">
            <div className="flex gap-3 mb-3">
              {img ? (
                <img src={img} alt="" className="w-16 h-16 object-cover rounded-xl" />
              ) : (
                <div className="w-16 h-16 bg-[#FFF9ED] rounded-xl flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-[#E8A87C]" />
                </div>
              )}
              <div className="flex-1">
                <div className="h-8 bg-[#FFF9ED] rounded-lg mb-2" />
                <div className="h-4 bg-[#FFE5B4] rounded" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'elegant-05',
      name: 'Rose Gold',
      category: 'elegant',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#E8A87C] to-[#D4936A] p-4">
          <div className="w-full h-full bg-white rounded-xl p-4 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-24 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-lg mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-[#E8A87C]" />
              </div>
            )}
            <div className="h-10 bg-[#FFF9ED] rounded-lg mb-2" />
            <div className="h-6 bg-[#FFE5B4] rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'elegant-06',
      name: 'Marble Luxury',
      category: 'elegant',
      preview: (img) => (
        <div className="w-full h-full bg-gray-50 p-4">
          <div className="w-full h-full bg-white border-2 border-gray-200 rounded-lg p-4 flex flex-col shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              {img ? (
                <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="h-8 bg-gray-100 rounded mb-1" />
                <div className="h-4 bg-gray-50 rounded" />
              </div>
            </div>
          </div>
        </div>
      ),
    },

    // MODERN TEMPLATES (13-18)
    {
      id: 'modern-01',
      name: 'Bold Diagonal',
      category: 'modern',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#FFC857] to-[#FFB627] p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16" />
          {img ? (
            <img src={img} alt="" className="relative z-10 w-full h-24 object-cover rounded-lg mb-3 shadow-lg" />
          ) : (
            <div className="relative z-10 w-full h-24 bg-white/30 rounded-lg mb-3 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
          )}
          <div className="relative z-10 h-10 bg-white/90 rounded-lg mb-2" />
          <div className="relative z-10 h-6 bg-white/70 rounded" />
        </div>
      ),
    },
    {
      id: 'modern-02',
      name: 'Neon Edge',
      category: 'modern',
      preview: (img) => (
        <div className="w-full h-full bg-gray-900 p-4">
          <div className="w-full h-full border-2 border-[#FFC857] rounded-xl p-4 flex flex-col shadow-[0_0_15px_rgba(255,200,87,0.5)]">
            {img ? (
              <img src={img} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-24 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-600" />
              </div>
            )}
            <div className="h-10 bg-gray-800 rounded-lg mb-2" />
            <div className="h-6 bg-gray-700 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'modern-03',
      name: 'Gradient Pop',
      category: 'modern',
      preview: (img) => (
        <div className="w-full h-full bg-white p-4">
          <div className="w-full h-full bg-gradient-to-br from-[#9DB5A5] via-[#FFC857] to-[#E8A87C] p-[2px] rounded-xl">
            <div className="w-full h-full bg-white rounded-xl p-4 flex flex-col">
              {img ? (
                <img src={img} alt="" className="w-full h-20 object-cover rounded-lg mb-3" />
              ) : (
                <div className="w-full h-20 bg-gray-50 rounded-lg mb-3 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="h-10 bg-gray-50 rounded-lg mb-2" />
              <div className="h-6 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'modern-04',
      name: 'Floating Card',
      category: 'modern',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] p-4 flex items-center justify-center">
          <div className="w-full bg-white rounded-2xl p-4 shadow-2xl transform">
            {img ? (
              <img src={img} alt="" className="w-full h-20 object-cover rounded-xl mb-3" />
            ) : (
              <div className="w-full h-20 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-300" />
              </div>
            )}
            <div className="h-8 bg-gray-100 rounded-lg mb-2" />
            <div className="h-4 bg-gray-50 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'modern-05',
      name: 'Glass Morphism',
      category: 'modern',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#9DB5A5] to-[#E8A87C] p-4">
          <div className="w-full h-full bg-white/20 backdrop-blur-lg rounded-2xl p-4 border border-white/30 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-24 object-cover rounded-xl mb-3 shadow-lg" />
            ) : (
              <div className="w-full h-24 bg-white/30 rounded-xl mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-white" />
              </div>
            )}
            <div className="h-10 bg-white/40 rounded-lg mb-2" />
            <div className="h-6 bg-white/30 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'modern-06',
      name: 'Tech Grid',
      category: 'modern',
      preview: (img) => (
        <div className="w-full h-full bg-gray-950 p-4" style={{ backgroundImage: 'linear-gradient(rgba(255,200,87,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,87,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          <div className="w-full h-full bg-gray-900/90 backdrop-blur rounded-xl p-4 border border-[#FFC857]/30 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-20 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-600" />
              </div>
            )}
            <div className="h-10 bg-gray-800 rounded-lg mb-2" />
            <div className="h-6 bg-gray-700 rounded" />
          </div>
        </div>
      ),
    },

    // CLASSIC TEMPLATES (19-24)
    {
      id: 'classic-01',
      name: 'Traditional',
      category: 'classic',
      preview: (img) => (
        <div className="w-full h-full bg-[#FFF9ED] p-4">
          <div className="w-full h-full border-4 border-double border-[#8B7355] rounded p-4 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-20 object-cover border-2 border-[#8B7355] mb-3" />
            ) : (
              <div className="w-full h-20 bg-white border-2 border-[#8B7355] mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-[#8B7355]" />
              </div>
            )}
            <div className="h-10 bg-white border border-[#8B7355] rounded mb-2" />
            <div className="h-6 bg-white border border-[#8B7355] rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'classic-02',
      name: 'Vintage Stamp',
      category: 'classic',
      preview: (img) => (
        <div className="w-full h-full bg-[#E8DCC8] p-4">
          <div className="w-full h-full bg-white rounded p-4 border-4 border-dashed border-[#C8A882] flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-24 h-24 object-cover rounded-full mx-auto mb-3 border-2 border-[#C8A882]" />
            ) : (
              <div className="w-24 h-24 bg-[#FFF9ED] rounded-full mx-auto mb-3 border-2 border-[#C8A882] flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-[#C8A882]" />
              </div>
            )}
            <div className="h-8 bg-[#FFF9ED] rounded mb-2" />
            <div className="h-6 bg-[#FFE5B4] rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'classic-03',
      name: 'Certificate Style',
      category: 'classic',
      preview: (img) => (
        <div className="w-full h-full bg-white p-3">
          <div className="w-full h-full border-8 border-[#C8A882] border-double rounded-lg p-3 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              {img ? (
                <img src={img} alt="" className="w-20 h-20 object-cover rounded-full border-4 border-[#C8A882]" />
              ) : (
                <div className="w-20 h-20 bg-[#FFF9ED] rounded-full border-4 border-[#C8A882] flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-[#C8A882]" />
                </div>
              )}
            </div>
            <div className="h-8 bg-[#FFF9ED] rounded mb-1" />
            <div className="h-4 bg-[#FFE5B4] rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'classic-04',
      name: 'Ticket Stub',
      category: 'classic',
      preview: (img) => (
        <div className="w-full h-full bg-white flex">
          <div className="w-1/4 bg-[#FFC857] flex items-center justify-center border-r-4 border-dashed border-white">
            <div className="transform -rotate-90 text-white font-bold text-xs">VOUCHER</div>
          </div>
          <div className="flex-1 p-3 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-16 object-cover rounded mb-2" />
            ) : (
              <div className="w-full h-16 bg-gray-100 rounded mb-2 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-gray-300" />
              </div>
            )}
            <div className="h-8 bg-gray-100 rounded mb-1" />
            <div className="h-4 bg-gray-50 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'classic-05',
      name: 'Ornate Border',
      category: 'classic',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#FFF9ED] to-[#E8DCC8] p-3">
          <div className="w-full h-full bg-white rounded-lg p-3 border-2 border-[#C8A882] shadow-inner relative">
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#C8A882]" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#C8A882]" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#C8A882]" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#C8A882]" />
            {img ? (
              <img src={img} alt="" className="w-full h-20 object-cover rounded mb-2" />
            ) : (
              <div className="w-full h-20 bg-[#FFF9ED] rounded mb-2 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-[#C8A882]" />
              </div>
            )}
            <div className="h-8 bg-gray-50 rounded mb-1" />
            <div className="h-4 bg-gray-100 rounded" />
          </div>
        </div>
      ),
    },
    {
      id: 'classic-06',
      name: 'Postcard',
      category: 'classic',
      preview: (img) => (
        <div className="w-full h-full bg-[#FFF9ED] p-4 flex">
          {img ? (
            <img src={img} alt="" className="w-1/2 object-cover border-2 border-[#8B7355]" />
          ) : (
            <div className="w-1/2 bg-white border-2 border-[#8B7355] flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-[#8B7355]" />
            </div>
          )}
          <div className="flex-1 p-3 flex flex-col justify-center">
            <div className="h-3 bg-[#8B7355] rounded mb-2" />
            <div className="h-3 bg-[#8B7355] rounded mb-2" />
            <div className="h-3 bg-[#8B7355] rounded mb-2" />
            <div className="h-3 bg-[#8B7355] rounded" />
          </div>
        </div>
      ),
    },

    // CREATIVE TEMPLATES (25-30)
    {
      id: 'creative-01',
      name: 'Artistic Splash',
      category: 'creative',
      preview: (img) => (
        <div className="w-full h-full bg-white p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC857] rounded-full opacity-30 -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#9DB5A5] rounded-full opacity-30 -ml-12 -mb-12" />
          {img ? (
            <img src={img} alt="" className="relative z-10 w-full h-24 object-cover rounded-2xl shadow-lg mb-3" />
          ) : (
            <div className="relative z-10 w-full h-24 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-2xl shadow-lg mb-3 flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-[#C8A882]" />
            </div>
          )}
          <div className="relative z-10 h-10 bg-gray-100 rounded-xl mb-2" />
          <div className="relative z-10 h-6 bg-gray-50 rounded-xl" />
        </div>
      ),
    },
    {
      id: 'creative-02',
      name: 'Origami Fold',
      category: 'creative',
      preview: (img) => (
        <div className="w-full h-full bg-white p-4">
          <div className="w-full h-full bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[30px] border-l-transparent border-t-[30px] border-t-[#FFC857]" />
            <div className="p-4 flex flex-col h-full">
              {img ? (
                <img src={img} alt="" className="w-full h-20 object-cover rounded-lg mb-3 shadow-md" />
              ) : (
                <div className="w-full h-20 bg-white/50 rounded-lg mb-3 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-[#C8A882]" />
                </div>
              )}
              <div className="h-10 bg-white/70 rounded-lg mb-2" />
              <div className="h-6 bg-white/50 rounded-lg" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'creative-03',
      name: 'Hexagon Grid',
      category: 'creative',
      preview: (img) => (
        <div className="w-full h-full bg-gray-50 p-4">
          <div className="w-full h-full bg-white rounded-2xl p-4 shadow-lg flex flex-col">
            <div className="flex gap-2 mb-3">
              {img ? (
                <img src={img} alt="" className="w-16 h-16 object-cover" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-[#9DB5A5] to-[#FFC857] flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  <ImageIcon className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="flex-1">
                <div className="h-8 bg-gray-100 rounded-lg mb-1" />
                <div className="h-4 bg-gray-50 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'creative-04',
      name: 'Wave Pattern',
      category: 'creative',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] p-4 relative overflow-hidden">
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z" fill="white" opacity="0.2" />
          </svg>
          <div className="relative z-10 w-full h-full bg-white/90 rounded-xl p-4 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-24 object-cover rounded-lg mb-3" />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-300" />
              </div>
            )}
            <div className="h-10 bg-gray-100 rounded-lg mb-2" />
            <div className="h-6 bg-gray-50 rounded-lg" />
          </div>
        </div>
      ),
    },
    {
      id: 'creative-05',
      name: 'Geometric Shape',
      category: 'creative',
      preview: (img) => (
        <div className="w-full h-full bg-white p-4 relative">
          <div className="absolute top-4 left-4 w-12 h-12 bg-[#FFC857] transform rotate-45 opacity-20" />
          <div className="absolute bottom-4 right-4 w-8 h-8 bg-[#9DB5A5] rounded-full opacity-20" />
          <div className="relative z-10 w-full h-full border-2 border-gray-200 rounded-2xl p-4 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-24 object-cover rounded-xl mb-3 transform hover:scale-105 transition-transform" />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded-xl mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-300" />
              </div>
            )}
            <div className="h-10 bg-gray-100 rounded-lg mb-2" />
            <div className="h-6 bg-gray-50 rounded-lg" />
          </div>
        </div>
      ),
    },
    {
      id: 'creative-06',
      name: 'Confetti Joy',
      category: 'creative',
      preview: (img) => (
        <div className="w-full h-full bg-gradient-to-br from-[#FFF9ED] to-white p-4 relative overflow-hidden">
          <div className="absolute top-2 right-8 w-2 h-2 bg-[#FFC857] rounded-full" />
          <div className="absolute top-8 right-4 w-3 h-3 bg-[#E8A87C] rounded-full" />
          <div className="absolute top-4 left-6 w-2 h-2 bg-[#9DB5A5] rounded-full" />
          <div className="absolute bottom-6 left-8 w-3 h-3 bg-[#FFC857] transform rotate-45" />
          <div className="absolute bottom-8 right-12 w-2 h-2 bg-[#9DB5A5]" />
          <div className="relative z-10 w-full h-full bg-white rounded-2xl shadow-lg p-4 flex flex-col">
            {img ? (
              <img src={img} alt="" className="w-full h-24 object-cover rounded-xl mb-3" />
            ) : (
              <div className="w-full h-24 bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] rounded-xl mb-3 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-[#C8A882]" />
              </div>
            )}
            <div className="h-10 bg-gray-50 rounded-xl mb-2" />
            <div className="h-6 bg-gray-100 rounded-xl" />
          </div>
        </div>
      ),
    },
  ];

  const filteredTemplates = filter === 'all' 
    ? templates 
    : templates.filter(t => t.category === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#FFC857]" />
          <h3 className="font-semibold text-[#2D2721]">Choose Template</h3>
        </div>
        <div className="text-sm text-[#8B7355]">{filteredTemplates.length} templates</div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'minimal', 'elegant', 'modern', 'classic', 'creative'] as const).map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === category
                ? 'bg-gradient-to-r from-[#9DB5A5] to-[#7FA090] text-white shadow-warm'
                : 'bg-white border border-[rgba(139,115,85,0.2)] text-[#6B5744] hover:border-[#9DB5A5]'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className={`group relative rounded-[16px] overflow-hidden transition-all hover:scale-105 ${
              selectedTemplateId === template.id
                ? 'ring-4 ring-[#9DB5A5] shadow-warm-lg'
                : 'hover:shadow-warm-lg'
            }`}
          >
            {/* Preview */}
            <div className="aspect-[3/2] bg-white">
              {template.preview(defaultImage)}
            </div>

            {/* Selected Badge */}
            {selectedTemplateId === template.id && (
              <div className="absolute top-2 right-2 w-8 h-8 bg-gradient-to-br from-[#9DB5A5] to-[#7FA090] rounded-full flex items-center justify-center shadow-warm">
                <Check className="h-5 w-5 text-white" />
              </div>
            )}

            {/* Template Name */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
              <div className="text-white text-sm font-medium">{template.name}</div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-[#9DB5A5]/0 group-hover:bg-[#9DB5A5]/10 transition-colors pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
}
