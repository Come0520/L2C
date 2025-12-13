'use client';

import { Package, BarChart3, ArrowRight, ArrowLeft } from 'lucide-react';

import { PaperCard, PaperCardContent } from '@/components/ui/paper-card';
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav';

interface ToolsTabsProps {
  activeTab: 'inventory' | 'inbound' | 'outbound' | 'stats';
  onTabChange: (tab: 'inventory' | 'inbound' | 'outbound' | 'stats') => void;
}

export const ToolsTabs = ({ activeTab, onTabChange }: ToolsTabsProps) => {
  return (
    <PaperCard>
      <PaperCardContent>
        <PaperNav vertical={false}>
          <PaperNavItem 
            href="#" 
            active={activeTab === 'inventory'} 
            onClick={() => onTabChange('inventory')} 
            icon={<Package className="h-5 w-5" />}
          >
            库存管理
          </PaperNavItem>
          <PaperNavItem 
            href="#" 
            active={activeTab === 'inbound'} 
            onClick={() => onTabChange('inbound')} 
            icon={<ArrowRight className="h-5 w-5" />}
          >
            入库管理
          </PaperNavItem>
          <PaperNavItem 
            href="#" 
            active={activeTab === 'outbound'} 
            onClick={() => onTabChange('outbound')} 
            icon={<ArrowLeft className="h-5 w-5" />}
          >
            出库管理
          </PaperNavItem>
          <PaperNavItem 
            href="#" 
            active={activeTab === 'stats'} 
            onClick={() => onTabChange('stats')} 
            icon={<BarChart3 className="h-5 w-5" />}
          >
            库存统计
          </PaperNavItem>
        </PaperNav>
      </PaperCardContent>
    </PaperCard>
  );
};