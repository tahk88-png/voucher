import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';
import { CATEGORY_DATA, Category, SubCategory } from '@/app/data/categories';

interface CategorySelectorProps {
  onSelect: (category: string, subcategory: string) => void;
  selectedCategory?: string;
  selectedSubcategory?: string;
  className?: string;
}

export function CategorySelector({ 
  onSelect, 
  selectedCategory: initialCategory, 
  selectedSubcategory: initialSubcategory,
  className 
}: CategorySelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState<string | undefined>(initialSubcategory);

  const handleCategoryClick = (categoryId: string) => {
    if (activeCategory === categoryId) {
      // If clicking already selected, maybe just keep it or allow deselection?
      // For a wizard, we usually want to drill down.
      return;
    }
    setActiveCategory(categoryId);
    setActiveSubcategory(undefined); // Reset sub when main changes
  };

  const handleSubcategoryClick = (subId: string) => {
    setActiveSubcategory(subId);
    if (activeCategory) {
      onSelect(activeCategory, subId);
    }
  };

  const selectedCategoryData = CATEGORY_DATA.find(c => c.id === activeCategory);

  return (
    <div className={cn("w-full space-y-6", className)}>
      
      {/* 1. Main Category Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#6B5744]">Vali valdkond</label>
          {activeCategory && (
            <button 
              onClick={() => { setActiveCategory(undefined); setActiveSubcategory(undefined); }}
              className="text-xs text-[#E17B5C] hover:underline"
            >
              Tühista valik
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORY_DATA.map((category) => {
            const Icon = category.icon;
            const isSelected = activeCategory === category.id;
            const isDimmed = activeCategory && !isSelected;

            return (
              <motion.button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative p-4 rounded-xl border text-left transition-all duration-300 h-32 flex flex-col justify-between overflow-hidden group",
                  isSelected 
                    ? "border-[#E17B5C] ring-1 ring-[#E17B5C] bg-[#FFF9ED]" 
                    : "border-[#E7DCC7] bg-white hover:border-[#E17B5C]/50",
                  isDimmed && "opacity-50 grayscale-[0.5]"
                )}
              >
                {/* Background Gradient Blob (Subtle) */}
                <div className={cn(
                  "absolute -right-4 -top-4 w-20 h-20 rounded-full blur-2xl opacity-20 bg-gradient-to-br transition-all",
                  category.gradient,
                  isSelected ? "opacity-40 scale-150" : "group-hover:opacity-30"
                )} />

                <div className={cn(
                  "p-2 rounded-lg w-fit transition-colors",
                  isSelected ? "bg-[#E17B5C] text-white" : "bg-[#FAF7F2] text-[#6B5744] group-hover:text-[#E17B5C]"
                )}>
                  <Icon className="w-5 h-5" />
                </div>

                <div>
                  <h3 className={cn(
                    "font-display font-bold text-sm leading-tight mb-1",
                    isSelected ? "text-[#2D2721]" : "text-[#2D2721]"
                  )}>
                    {category.label}
                  </h3>
                  <p className="text-[10px] text-[#8B7355] line-clamp-1 opacity-80">
                    {category.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-[#E17B5C] rounded-full p-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Subcategory Selection (Animate in when category selected) */}
      <AnimatePresence>
        {activeCategory && selectedCategoryData && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-[#FAF7F2] rounded-xl border border-[#E7DCC7] border-dashed">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 bg-[#E17B5C] rounded-full" />
                <h4 className="font-medium text-[#2D2721]">Täpsusta {selectedCategoryData.label.toLowerCase()} tüüp</h4>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedCategoryData.subcategories.map((sub) => {
                  const isSelected = activeSubcategory === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubcategoryClick(sub.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 flex items-center gap-2",
                        isSelected
                          ? "bg-[#2D2721] text-white border-[#2D2721] shadow-lg scale-105"
                          : "bg-white text-[#6B5744] border-[#E7DCC7] hover:border-[#E17B5C] hover:text-[#E17B5C]"
                      )}
                    >
                      {sub.label}
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Visual Confirmation of Path */}
              <div className="mt-4 pt-4 border-t border-[#E7DCC7]/50 flex items-center gap-2 text-xs text-[#8B7355]">
                <span className="font-bold">{selectedCategoryData.label}</span>
                <ChevronRight className="w-3 h-3" />
                <span className={activeSubcategory ? "font-bold text-[#E17B5C]" : "italic opacity-50"}>
                  {activeSubcategory 
                    ? selectedCategoryData.subcategories.find(s => s.id === activeSubcategory)?.label 
                    : "Vali tüüp..."}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
