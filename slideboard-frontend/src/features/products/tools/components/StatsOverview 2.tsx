'use client';

import { PaperStatus } from '@/components/ui/paper-badge';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';
import { VirtualizedTableBody } from '@/components/ui/virtualized-table-body';

import { SalesTool, StockStats } from '../useToolsPageState';

interface StatsOverviewProps {
  stats: StockStats;
  tools: SalesTool[];
  selectedStore: string;
  getStatusText: (status: SalesTool['status']) => string;
  getStatusColor: (status: SalesTool['status']) => 'success' | 'warning' | 'error' | 'info';
}

export const StatsOverview = ({
  stats,
  tools,
  selectedStore,
  getStatusText,
  getStatusColor
}: StatsOverviewProps) => {
  const storeTools = tools.filter(tool => tool.store === selectedStore);

  const renderStockDetailRow = (tool: SalesTool) => (
    <PaperTableRow key={tool.id}>
      <PaperTableCell>{tool.name}</PaperTableCell>
      <PaperTableCell>{tool.sku}</PaperTableCell>
      <PaperTableCell>销售道具</PaperTableCell>
      <PaperTableCell>{tool.stock} {tool.unit}</PaperTableCell>
      <PaperTableCell>
        <PaperStatus 
          status={getStatusColor(tool.status)} 
          text={getStatusText(tool.status)} 
        />
      </PaperTableCell>
    </PaperTableRow>
  );

  return (
    <>
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-ink-800 mb-1">{stats.totalItems}</div>
              <div className="text-sm text-ink-500">商品总数</div>
            </div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-ink-800 mb-1">{stats.totalStock}</div>
              <div className="text-sm text-ink-500">总库存数量</div>
            </div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-error-600 mb-1">{stats.lowStockItems}</div>
              <div className="text-sm text-ink-500">库存不足商品</div>
            </div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600 mb-1">¥{stats.totalValue.toLocaleString()}</div>
              <div className="text-sm text-ink-500">库存总价值</div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 进出库统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>入库统计</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-success-600 mb-2">{stats.inCount}</div>
              <div className="text-sm text-ink-500">本月入库次数</div>
            </div>
          </PaperCardContent>
        </PaperCard>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>出库统计</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-warning-600 mb-2">{stats.outCount}</div>
              <div className="text-sm text-ink-500">本月出库次数</div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>

      {/* 库存明细 */}
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>库存明细</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent className="p-0">
          <PaperTable>
            <PaperTableHeader>
              <PaperTableCell>商品名称</PaperTableCell>
              <PaperTableCell>SKU</PaperTableCell>
              <PaperTableCell>分类</PaperTableCell>
              <PaperTableCell>当前库存</PaperTableCell>
              <PaperTableCell>库存状态</PaperTableCell>
            </PaperTableHeader>
            <VirtualizedTableBody
              items={storeTools}
              renderRow={renderStockDetailRow}
              estimatedRowHeight={60}
              containerHeight={400}
            />
          </PaperTable>
        </PaperCardContent>
      </PaperCard>
    </>
  );
};