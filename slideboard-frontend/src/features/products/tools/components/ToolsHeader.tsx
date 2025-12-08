'use client';

import { Plus } from 'lucide-react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperSelect } from '@/components/ui/paper-input';

interface ToolsHeaderProps {
  selectedStore: string;
  stores: Array<{ value: string; label: string }>;
  onStoreChange: (value: string) => void;
}

export const ToolsHeader = ({ selectedStore, stores, onStoreChange }: ToolsHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-ink-800">销售道具管理</h1>
        <p className="text-ink-500 mt-1">各门店独立管理销售道具的库存、进出库及统计</p>
      </div>
      <div className="flex items-center space-x-3">
        <PaperSelect 
          label="门店" 
          options={stores} 
          value={selectedStore} 
          onChange={(e) => onStoreChange(e.target.value)} 
        />
        <PaperButton variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          新增商品
        </PaperButton>
      </div>
    </div>
  );
};