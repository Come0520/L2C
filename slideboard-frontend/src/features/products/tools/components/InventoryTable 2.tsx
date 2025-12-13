'use client';

import { Eye, Edit } from 'lucide-react';
import Image from 'next/image';

import { PaperStatus } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableRow, PaperTableCell, PaperTablePagination } from '@/components/ui/paper-table';
import { VirtualizedTableBody } from '@/components/ui/virtualized-table-body';

import { SalesTool } from '../useToolsPageState';

interface InventoryTableProps {
  tools: SalesTool[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  getStatusText: (status: SalesTool['status']) => string;
  getStatusColor: (status: SalesTool['status']) => 'success' | 'warning' | 'error' | 'info';
  onPageChange: (page: number) => void;
  onViewProduct: (product: SalesTool) => void;
}

export const InventoryTable = ({
  tools,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  getStatusText,
  getStatusColor,
  onPageChange,
  onViewProduct
}: InventoryTableProps) => {
  const renderRow = (tool: SalesTool) => (
    <PaperTableRow key={tool.id}>
      <PaperTableCell>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-paper-600">
            <Image 
              src={tool.imageUrl} 
              alt={tool.name} 
              width={48} 
              height={48} 
              className="object-cover w-full h-full" 
              unoptimized 
            />
          </div>
          <div>
            <p className="font-medium text-ink-800">{tool.name}</p>
            <p className="text-sm text-ink-500">SKU: {tool.sku}</p>
          </div>
        </div>
      </PaperTableCell>
      <PaperTableCell>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-ink-800">销售道具</span>
          <span className="text-xs text-ink-500">{tool.subCategory}</span>
        </div>
      </PaperTableCell>
      <PaperTableCell>
        <div className="space-y-1">
          <div className="text-sm font-medium text-success-600">¥{tool.price.toLocaleString()}</div>
          <div className="text-xs text-ink-500">成本: ¥{tool.cost.toLocaleString()}</div>
        </div>
      </PaperTableCell>
      <PaperTableCell>
        <div className="space-y-1">
          <div className="text-sm font-medium text-ink-800">{tool.stock} {tool.unit}</div>
          <div className="text-xs text-ink-500">
            安全库存: {tool.minStock}-{tool.maxStock} {tool.unit}
          </div>
        </div>
      </PaperTableCell>
      <PaperTableCell>
        <PaperStatus 
          status={getStatusColor(tool.status)} 
          text={getStatusText(tool.status)} 
        />
      </PaperTableCell>
      <PaperTableCell>
        <div className="flex space-x-2">
          <PaperButton size="sm" variant="ghost" onClick={() => onViewProduct(tool)}>
            <Eye className="h-3 w-3" />
          </PaperButton>
          <PaperButton size="sm" variant="outline">
            <Edit className="h-3 w-3" />
          </PaperButton>
        </div>
      </PaperTableCell>
    </PaperTableRow>
  );

  return (
    <PaperCard>
      <PaperCardHeader>
        <div className="flex items-center justify-between">
          <PaperCardTitle>商品列表</PaperCardTitle>
          <PaperButton variant="outline" size="sm">导出数据</PaperButton>
        </div>
      </PaperCardHeader>
      <PaperCardContent className="p-0">
        <PaperTable>
          <PaperTableHeader>
            <PaperTableCell>商品信息</PaperTableCell>
            <PaperTableCell>分类</PaperTableCell>
            <PaperTableCell>价格</PaperTableCell>
            <PaperTableCell>库存</PaperTableCell>
            <PaperTableCell>状态</PaperTableCell>
            <PaperTableCell>操作</PaperTableCell>
          </PaperTableHeader>
          <VirtualizedTableBody
            items={tools}
            renderRow={renderRow}
            estimatedRowHeight={100}
            containerHeight={400}
          />
        </PaperTable>
        <PaperTablePagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={totalItems} 
          itemsPerPage={itemsPerPage} 
          onPageChange={onPageChange} 
        />
      </PaperCardContent>
    </PaperCard>
  );
};