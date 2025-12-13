'use client';

import { Search } from 'lucide-react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard } from '@/components/ui/paper-card';
import { PaperInput, PaperSelect } from '@/components/ui/paper-input';
import { PaperTableToolbar } from '@/components/ui/paper-table';


interface ToolsSearchBarProps {
  searchTerm: string;
  statusFilter: string;
  activeTab: 'inventory' | 'inbound' | 'outbound' | 'stats';
  statusOptions: Array<{ value: string; label: string }>;
  selectedStore: string;
  onSearchTermChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onSearch: () => void;
}

export const ToolsSearchBar = ({
  searchTerm,
  statusFilter,
  activeTab,
  statusOptions,
  selectedStore,
  onSearchTermChange,
  onStatusFilterChange,
  onSearch
}: ToolsSearchBarProps) => {
  return (
    <PaperCard>
      <PaperTableToolbar>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <PaperInput 
              placeholder="搜索商品名称、SKU..." 
              value={searchTerm} 
              onChange={(e) => onSearchTermChange(e.target.value)} 
              className="w-full" 
              icon={<Search className="h-4 w-4" />} 
            />
          </div>
          {activeTab === 'inventory' && (
            <div className="w-48">
              <PaperSelect 
                value={statusFilter} 
                onChange={(e) => onStatusFilterChange(e.target.value)} 
                options={statusOptions} 
                placeholder="选择状态" 
              />
            </div>
          )}
          <PaperButton onClick={onSearch}>
            <Search className="h-4 w-4 mr-2" />
            搜索
          </PaperButton>
        </div>
        <div className="text-sm text-ink-500">{selectedStore}</div>
      </PaperTableToolbar>
    </PaperCard>
  );
};