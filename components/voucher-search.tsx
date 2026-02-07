'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WarmButton } from '@/components/warm-button';
import { Search, X } from 'lucide-react';

interface VoucherSearchProps {
  onSearch: (query: string) => void;
  onFilter: (filters: {
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  onSort: (sortBy: string) => void;
}

export default function VoucherSearch({ onSearch, onFilter, onSort }: VoucherSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = () => {
    onFilter({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onSort(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy('newest');
    onSearch('');
    onFilter({});
    onSort('newest');
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8B7355]" />
          <Input
            placeholder="Search vouchers..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 border-[#E7DCC7]"
            aria-label="Search vouchers"
          />
        </div>
        {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
          <WarmButton variant="outline" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </WarmButton>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          handleFilterChange();
        }}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(value) => {
          setTypeFilter(value);
          handleFilterChange();
        }}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
            <SelectItem value="credit_amount">Credit Amount</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]" aria-label="Sort vouchers">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="redemptions">Most Redemptions</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
