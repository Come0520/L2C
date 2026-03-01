'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2';
import LayoutList from 'lucide-react/dist/esm/icons/layout-list';
import Table2 from 'lucide-react/dist/esm/icons/table';
import {
  QuoteSummaryCalculator,
  type QuoteSummaryData,
  type QuoteSummaryItem,
  type CategoryRoomDetail,
  type CategorySummary,
} from './quote-summary-calculator';

/** 三级视图模式 */
type SummaryViewMode = 'minimal' | 'standard' | 'detailed';

interface QuoteSummaryTabProps {
  /** 所有报价项 */
  items: QuoteSummaryItem[];
  /** 空间列表 */
  rooms: { id: string; name: string; items?: QuoteSummaryItem[] }[];
  /** 额外的 className */
  className?: string;
}

/**
 * 格式化金额显示
 */
function formatMoney(value: number): string {
  return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * 报价汇总页组件
 * 支持极简版、标准版和详细版三种视图
 */
export const QuoteSummaryTab = React.memo(function QuoteSummaryTab({
  items,
  rooms,
  className,
}: QuoteSummaryTabProps) {
  // 默认极简视图
  const [viewMode, setViewMode] = useState<SummaryViewMode>('minimal');

  /** 视图模式配置 */
  const VIEW_MODES: { key: SummaryViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'minimal', label: '极简版', icon: <Minimize2 className="h-4 w-4" /> },
    { key: 'standard', label: '标准版', icon: <LayoutList className="h-4 w-4" /> },
    { key: 'detailed', label: '详细版', icon: <Table2 className="h-4 w-4" /> },
  ];

  return (
    <QuoteSummaryCalculator items={items} rooms={rooms}>
      {(summary: QuoteSummaryData) => {
        // 过滤掉没钱还没商品的空品类（排除占位符）
        const validCategories = summary.categorySummaries.filter(
          (cat) =>
            cat.subtotal > 0 || cat.roomBreakdown.some((r) => r.items.some((i) => i.productName))
        );

        return (
          <Card className={cn('', className)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">报价汇总</CardTitle>
                {/* 三级视图切换按钮 - 内联强制高亮 */}
                <div className="bg-muted/60 flex gap-0.5 rounded-lg p-1">
                  {VIEW_MODES.map((mode) => {
                    const isActive = viewMode === mode.key;
                    return (
                      <Button
                        key={mode.key}
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode(mode.key)}
                        className="gap-1.5 rounded-md transition-all"
                        style={
                          isActive
                            ? {
                                backgroundColor: 'hsl(222, 47%, 31%)',
                                color: '#fff',
                                fontWeight: 600,
                                boxShadow: '0 1px 3px rgba(0,0,0,.25)',
                              }
                            : { color: 'hsl(215, 16%, 57%)' }
                        }
                      >
                        {mode.icon}
                        {mode.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {viewMode === 'minimal' && (
                <MinimalView categories={validCategories} summary={summary} />
              )}
              {viewMode === 'standard' && (
                <StandardView categories={validCategories} summary={summary} />
              )}
              {viewMode === 'detailed' && (
                <DetailedView categories={validCategories} summary={summary} />
              )}
            </CardContent>
          </Card>
        );
      }}
    </QuoteSummaryCalculator>
  );
});

/* ========== 极简视图：品类 → 空间小计 ========== */
function MinimalView({
  categories,
  summary,
}: {
  categories: CategorySummary[];
  summary: QuoteSummaryData;
}) {
  if (categories.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">暂无报价数据</div>;
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.category} className="overflow-hidden rounded-lg border">
          {/* 品类标题行 */}
          <div className="bg-primary/5 flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold">{cat.categoryLabel}</span>
            </div>
            <span className="text-primary text-lg font-bold">{formatMoney(cat.subtotal)}</span>
          </div>
          {/* 空间小计列表 */}
          {cat.roomBreakdown.length > 0 && (
            <div className="divide-y border-t">
              {cat.roomBreakdown.map((room) => {
                if (room.subtotal === 0 && !room.items.some((i) => i.productName)) return null;
                return (
                  <div
                    key={room.roomId}
                    className="bg-muted/20 flex items-center justify-between px-6 py-2"
                  >
                    <span className="text-muted-foreground text-sm">{room.roomName}</span>
                    <span className="text-sm font-medium">{formatMoney(room.subtotal)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      {/* 总计 */}
      <TotalBar grandTotal={summary.grandTotal} totalItemCount={summary.totalItemCount} />
    </div>
  );
}

/* ========== 标准视图：品类 → 空间 → 行项目（快速报价字段） ========== */
function StandardView({
  categories,
  summary,
}: {
  categories: CategorySummary[];
  summary: QuoteSummaryData;
}) {
  if (categories.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">暂无报价数据</div>;
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.category} className="overflow-hidden rounded-lg border">
          <StaticCategoryHeader cat={cat} />
          <div className="border-t">
            {cat.roomBreakdown.map((room) => {
              const validItems = room.items.filter(
                (i) => Number(i.subtotal || 0) > 0 || i.productName
              );
              if (validItems.length === 0) return null;
              return (
                <RoomItemsSection
                  key={room.roomId}
                  room={{ ...room, items: validItems }}
                  showAdvanced={false}
                />
              );
            })}
          </div>
        </div>
      ))}
      <TotalBar grandTotal={summary.grandTotal} totalItemCount={summary.totalItemCount} />
    </div>
  );
}

/* ========== 详细视图：品类 → 空间 → 行项目 + 高级参数 ========== */
function DetailedView({
  categories,
  summary,
}: {
  categories: CategorySummary[];
  summary: QuoteSummaryData;
}) {
  if (categories.length === 0) {
    return <div className="text-muted-foreground py-8 text-center">暂无报价数据</div>;
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => (
        <div key={cat.category} className="overflow-hidden rounded-lg border">
          <StaticCategoryHeader cat={cat} />
          <div className="border-t">
            {cat.roomBreakdown.map((room) => {
              const validItems = room.items.filter(
                (i) => Number(i.subtotal || 0) > 0 || i.productName
              );
              if (validItems.length === 0) return null;
              return (
                <RoomItemsSection
                  key={room.roomId}
                  room={{ ...room, items: validItems }}
                  showAdvanced={true}
                />
              );
            })}
          </div>
        </div>
      ))}
      <TotalBar grandTotal={summary.grandTotal} totalItemCount={summary.totalItemCount} />
    </div>
  );
}

/* ========== 共用子组件 ========== */

/** 静态品类标题行（不可折叠） */
function StaticCategoryHeader({
  cat,
}: {
  cat: { categoryLabel: string; roomCount: number; itemCount: number; subtotal: number };
}) {
  return (
    <div className="bg-primary/5 flex w-full items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="font-semibold">{cat.categoryLabel}</span>
      </div>
      <span className="text-primary text-lg font-bold">{formatMoney(cat.subtotal)}</span>
    </div>
  );
}

/** 空间下的行项目列表 */
function RoomItemsSection({
  room,
  showAdvanced,
}: {
  room: CategoryRoomDetail;
  showAdvanced: boolean;
}) {
  return (
    <div className="border-b last:border-b-0">
      {/* 空间标题 */}
      <div className="bg-muted/30 flex items-center justify-between px-6 py-2">
        <span className="text-muted-foreground text-sm font-medium">{room.roomName}</span>
        <span className="text-sm font-medium">{formatMoney(room.subtotal)}</span>
      </div>
      {/* 行项目列表 */}
      <div className="divide-y">
        {room.items.map((item) => (
          <div key={item.id} className="px-8 py-2.5">
            {/* 第一行：商品名称 + 金额 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {item.productName || `商品 #${item.id.slice(-6)}`}
              </span>
              <span className="text-sm font-medium">
                {formatMoney(parseFloat(String(item.subtotal || 0)))}
              </span>
            </div>
            {/* 第二行：数量 × 单价 */}
            <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-xs">
              {item.quantity !== undefined && item.quantity !== null && (
                <span>
                  数量: {String(item.quantity)}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              )}
              {item.unitPrice !== undefined && item.unitPrice !== null && (
                <span>单价: ¥{parseFloat(String(item.unitPrice)).toFixed(2)}</span>
              )}
            </div>
            {/* 第三行：高级参数（仅详细视图展示） */}
            {showAdvanced && <AdvancedParams item={item} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 高级参数显示（仅详细视图） */
function AdvancedParams({ item }: { item: QuoteSummaryItem }) {
  const params: { label: string; value: string }[] = [];

  if (item.width && parseFloat(String(item.width)) > 0) {
    params.push({ label: '宽', value: `${parseFloat(String(item.width))}cm` });
  }
  if (item.height && parseFloat(String(item.height)) > 0) {
    params.push({ label: '高', value: `${parseFloat(String(item.height))}cm` });
  }
  if (item.foldRatio && parseFloat(String(item.foldRatio)) > 0) {
    params.push({ label: '褶皱倍率', value: `×${parseFloat(String(item.foldRatio))}` });
  }
  if (item.processFee && parseFloat(String(item.processFee)) > 0) {
    params.push({ label: '加工费', value: `¥${parseFloat(String(item.processFee)).toFixed(2)}` });
  }
  if (item.remark) {
    params.push({ label: '备注', value: item.remark });
  }

  if (params.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {params.map((p, i) => (
        <span key={i} className="text-muted-foreground">
          <span className="text-muted-foreground/80 font-medium">{p.label}:</span> {p.value}
        </span>
      ))}
    </div>
  );
}

/** 总计栏 */
function TotalBar({ grandTotal, totalItemCount }: { grandTotal: number; totalItemCount: number }) {
  return (
    <div className="bg-primary text-primary-foreground mt-4 flex items-center justify-between rounded-lg px-4 py-4">
      <div>
        <span className="text-lg font-semibold">总计</span>
        <span className="ml-2 text-sm opacity-80">{totalItemCount}件商品</span>
      </div>
      <span className="text-2xl font-bold">{formatMoney(grandTotal)}</span>
    </div>
  );
}
