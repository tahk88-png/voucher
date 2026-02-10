'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Smartphone, Monitor, Tablet, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { FIGMA_ROUTE_LIST } from './route-list';

function examplePath(path: string) {
  if (!path.includes(':')) return path;
  return path.replace(':id', 'demo');
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';
type ViewMode = 'list' | 'grid';

export default function FigmaIndexPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'public' | 'dashboard'>('all');
  const [devicePreview, setDevicePreview] = useState<DeviceType | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showDescriptions, setShowDescriptions] = useState(true);

  const filteredRoutes = useMemo(() => {
    return FIGMA_ROUTE_LIST.filter((route) => {
      const matchesSearch = route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           route.path.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' ||
                             (selectedCategory === 'public' && !route.layout) ||
                             (selectedCategory === 'dashboard' && route.layout === 'dashboard');

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getDeviceClass = (device: DeviceType | null) => {
    switch (device) {
      case 'mobile': return 'max-w-sm mx-auto';
      case 'tablet': return 'max-w-2xl mx-auto';
      case 'desktop': return 'max-w-7xl mx-auto';
      default: return '';
    }
  };

  return (
      <div className="min-h-screen bg-[#FFFBF5]">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(139,115,85,0.15)] px-6 py-6 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#2D2721]">Figma Design Preview</h1>
              <p className="text-[#6B5744] mt-1">
                Browse and test all Figma UI designs. Dynamic routes use <code className="bg-[#F8F6F1] px-1 rounded">demo</code> as placeholder.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <WarmButton
                variant="ghost"
                size="sm"
                onClick={() => setShowDescriptions(!showDescriptions)}
                className="flex items-center gap-2"
              >
                {showDescriptions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDescriptions ? 'Hide' : 'Show'} Descriptions
              </WarmButton>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8B7355] w-4 h-4" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[rgba(139,115,85,0.15)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#FFC857]/50"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'public', label: 'Public' },
                { key: 'dashboard', label: 'Dashboard' }
              ].map(({ key, label }) => (
                <WarmButton
                  key={key}
                  variant={selectedCategory === key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(key as any)}
                >
                  {label}
                </WarmButton>
              ))}
            </div>

            {/* View Mode */}
            <div className="flex gap-2">
              <WarmButton
                variant={viewMode === 'grid' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </WarmButton>
              <WarmButton
                variant={viewMode === 'list' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </WarmButton>
            </div>

            {/* Device Preview */}
            <div className="flex gap-2 border-l border-[rgba(139,115,85,0.15)] pl-4">
              {[
                { key: 'mobile', icon: Smartphone, label: 'Mobile' },
                { key: 'tablet', icon: Tablet, label: 'Tablet' },
                { key: 'desktop', icon: Monitor, label: 'Desktop' }
              ].map(({ key, icon: Icon, label }) => (
                <WarmButton
                  key={key}
                  variant={devicePreview === key ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setDevicePreview(devicePreview === key ? null : key as DeviceType)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </WarmButton>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`px-6 py-8 ${getDeviceClass(devicePreview)}`}>
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="mb-8">
            <p className="text-[#6B5744]">
              Showing {filteredRoutes.length} of {FIGMA_ROUTE_LIST.length} routes
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>

          {/* Routes Grid/List */}
          <div className={
            viewMode === 'grid'
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "space-y-3"
          }>
            {filteredRoutes.map((route, index) => {
              const fullUrl = `/figma${examplePath(route.path)}`;
              const delay = Math.min(index * 24, 300);

              return (
                <WarmCard
                  key={route.path}
                  className="group hover:shadow-warm transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${delay}ms` }}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#2D2721] group-hover:text-[#FFC857] transition-colors">
                          {route.title}
                        </h3>
                        <p className="text-sm text-[#8B7355] font-mono mt-1">
                          {route.path}
                        </p>
                        {route.layout && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs bg-[#FFF9ED] text-[#8B7355] rounded-full">
                            {route.layout}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <WarmButton
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}${fullUrl}`)}
                          className="p-2"
                        >
                          <Copy className="w-4 h-4" />
                        </WarmButton>
                        <WarmButton
                          variant="ghost"
                          size="sm"
                          asChild
                          className="p-2"
                        >
                          <a href={fullUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </WarmButton>
                      </div>
                    </div>

                    {showDescriptions && (
                      <p className="text-sm text-[#6B5744] mb-4">
                        Preview the {route.title.toLowerCase()} design screen with interactive components.
                      </p>
                    )}

                    <WarmButton asChild className="w-full">
                      <Link href={fullUrl}>
                        View Design
                      </Link>
                    </WarmButton>
                  </div>
                </WarmCard>
              );
            })}
          </div>

          {filteredRoutes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#6B5744] text-lg">No routes found matching your criteria.</p>
              <WarmButton
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </WarmButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
