import { WarmButton } from '@/app/components/WarmButton';
import { WarmCard } from '@/app/components/WarmCard';
import { Gift, Heart, Star, Sparkles } from 'lucide-react';

export function ComponentShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4] p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#2D2721] mb-4">Design System Showcase</h1>
          <p className="text-lg text-[#6B5744]">Warm, premium, and friendly components</p>
        </div>

        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-semibold text-[#2D2721] mb-6">Buttons</h2>
          <WarmCard padding="lg">
            <div className="space-y-6">
              {/* Primary */}
              <div>
                <h3 className="text-sm font-medium text-[#8B7355] mb-3">Primary</h3>
                <div className="flex flex-wrap gap-3">
                  <WarmButton size="sm">
                    <Gift className="h-4 w-4 mr-2" />
                    Small
                  </WarmButton>
                  <WarmButton size="md">Medium</WarmButton>
                  <WarmButton size="lg">Large</WarmButton>
                  <WarmButton isLoading>Loading</WarmButton>
                </div>
              </div>

              {/* Secondary */}
              <div>
                <h3 className="text-sm font-medium text-[#8B7355] mb-3">Secondary</h3>
                <div className="flex flex-wrap gap-3">
                  <WarmButton variant="secondary" size="sm">Small</WarmButton>
                  <WarmButton variant="secondary" size="md">Medium</WarmButton>
                  <WarmButton variant="secondary" size="lg">Large</WarmButton>
                </div>
              </div>

              {/* Outline */}
              <div>
                <h3 className="text-sm font-medium text-[#8B7355] mb-3">Outline</h3>
                <div className="flex flex-wrap gap-3">
                  <WarmButton variant="outline" size="sm">Small</WarmButton>
                  <WarmButton variant="outline" size="md">Medium</WarmButton>
                  <WarmButton variant="outline" size="lg">Large</WarmButton>
                </div>
              </div>

              {/* Ghost */}
              <div>
                <h3 className="text-sm font-medium text-[#8B7355] mb-3">Ghost</h3>
                <div className="flex flex-wrap gap-3">
                  <WarmButton variant="ghost" size="sm">Small</WarmButton>
                  <WarmButton variant="ghost" size="md">Medium</WarmButton>
                  <WarmButton variant="ghost" size="lg">Large</WarmButton>
                </div>
              </div>
            </div>
          </WarmCard>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-semibold text-[#2D2721] mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WarmCard padding="lg">
              <h3 className="font-semibold text-[#2D2721] mb-2">Default Card</h3>
              <p className="text-sm text-[#6B5744]">White background with soft shadow</p>
            </WarmCard>

            <WarmCard gradient padding="lg">
              <h3 className="font-semibold text-[#2D2721] mb-2">Gradient Card</h3>
              <p className="text-sm text-[#6B5744]">Warm beige gradient background</p>
            </WarmCard>

            <WarmCard hover padding="lg">
              <h3 className="font-semibold text-[#2D2721] mb-2">Hover Card</h3>
              <p className="text-sm text-[#6B5744]">Scales and lifts on hover</p>
            </WarmCard>
          </div>
        </section>

        {/* Status Chips */}
        <section>
          <h2 className="text-2xl font-semibold text-[#2D2721] mb-6">Status Chips</h2>
          <WarmCard padding="lg">
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-[#9DB5A5] text-white">
                Active
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-[#F2EDE3] text-[#6B5744]">
                Draft
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-[#FFE5B4] text-[#6B5744]">
                Scheduled
              </span>
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-[#E5E7EB] text-[#6B7280]">
                Expired
              </span>
            </div>
          </WarmCard>
        </section>

        {/* KPI Cards */}
        <section>
          <h2 className="text-2xl font-semibold text-[#2D2721] mb-6">KPI Cards</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Gift, label: 'Campaigns', value: '24', color: 'from-[#FFC857] to-[#FFB627]' },
              { icon: Heart, label: 'Redemptions', value: '1.2K', color: 'from-[#9DB5A5] to-[#7FA090]' },
              { icon: Star, label: 'Revenue', value: '€45K', color: 'from-[#E17B5C] to-[#D16B4C]' },
              { icon: Sparkles, label: 'Shares', value: '3.4K', color: 'from-[#F5C98E] to-[#E5B97E]' },
            ].map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <WarmCard key={index} hover padding="lg">
                  <div className={`w-12 h-12 rounded-[14px] bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-warm mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-[#2D2721] mb-1">{kpi.value}</div>
                  <div className="text-sm text-[#8B7355]">{kpi.label}</div>
                </WarmCard>
              );
            })}
          </div>
        </section>

        {/* Typography */}
        <section>
          <h2 className="text-2xl font-semibold text-[#2D2721] mb-6">Typography</h2>
          <WarmCard padding="lg">
            <div className="space-y-6">
              <div>
                <h1 className="text-[#2D2721]">Heading 1 - DM Sans Bold</h1>
                <p className="text-xs text-[#8B7355] mt-1">2.25rem (36px) • -0.02em tracking</p>
              </div>
              <div>
                <h2 className="text-[#2D2721]">Heading 2 - DM Sans Bold</h2>
                <p className="text-xs text-[#8B7355] mt-1">1.875rem (30px) • -0.01em tracking</p>
              </div>
              <div>
                <h3 className="text-[#2D2721]">Heading 3 - DM Sans Semibold</h3>
                <p className="text-xs text-[#8B7355] mt-1">1.5rem (24px)</p>
              </div>
              <div>
                <h4 className="text-[#2D2721]">Heading 4 - DM Sans Semibold</h4>
                <p className="text-xs text-[#8B7355] mt-1">1.25rem (20px)</p>
              </div>
              <div>
                <p className="text-[#6B5744]">
                  Body text - Regular weight with comfortable 1.6 line-height for readability. 
                  Perfect for descriptions, terms, and longer content blocks.
                </p>
                <p className="text-xs text-[#8B7355] mt-1">1rem (16px) • 1.6 line-height</p>
              </div>
            </div>
          </WarmCard>
        </section>

        {/* Colors */}
        <section>
          <h2 className="text-2xl font-semibold text-[#2D2721] mb-6">Color Palette</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { name: 'Cream 50', color: '#FFFBF5' },
              { name: 'Cream 100', color: '#FFF9ED' },
              { name: 'Beige 100', color: '#FFE5B4' },
              { name: 'Yellow 400', color: '#FFC857' },
              { name: 'Yellow 500', color: '#FFB627' },
              { name: 'Terracotta', color: '#E17B5C' },
              { name: 'Sage', color: '#9DB5A5' },
              { name: 'Brown 800', color: '#2D2721' },
            ].map((color) => (
              <WarmCard key={color.name} padding="md">
                <div
                  className="h-24 rounded-[12px] mb-3 shadow-warm"
                  style={{ backgroundColor: color.color }}
                />
                <div className="text-sm font-semibold text-[#2D2721]">{color.name}</div>
                <div className="text-xs text-[#8B7355] font-mono">{color.color}</div>
              </WarmCard>
            ))}
          </div>
        </section>

        {/* Gradients */}
        <section>
          <h2 className="text-2xl font-semibold text-[#2D2721] mb-6">Gradients</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 rounded-[20px] bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] shadow-warm flex items-center justify-center">
              <span className="text-sm font-semibold text-[#2D2721]">Warm</span>
            </div>
            <div className="h-32 rounded-[20px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] shadow-warm flex items-center justify-center">
              <span className="text-sm font-semibold text-[#2D2721]">Yellow</span>
            </div>
            <div className="h-32 rounded-[20px] bg-gradient-to-br from-[#FFC857] to-[#E17B5C] shadow-warm flex items-center justify-center">
              <span className="text-sm font-semibold text-[#2D2721]">Sunset</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
