'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import { updateQuoteItem } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';

import { logger } from '@/shared/lib/logger';

/**
 * 高级参数配置接口
 */
interface AdvancedAttributes {
  fabricWidth?: number; // 幅宽
  formula?: string; // 算料方式
  installPosition?: string; // 安装位置
  groundClearance?: number; // 离地高度
  openingStyle?: string; // 拉动方式
  headerType?: string; // 上带方式
  bottomType?: string; // 底边处理
  sideLoss?: number; // 边损
  bottomLoss?: number; // 底边损耗
  headerLoss?: number; // 帘头损耗
  customPanels?: { width: number }[]; // 自定义分片
  [key: string]: unknown;
}

/**
 * 报价项行内展开组件 Props
 */
interface QuoteItemExpandRowProps {
  /** 报价项 ID */
  itemId: string;
  /** 商品名称（用于显示） */
  productName: string;
  /** 商品分类 */
  category: string;
  /** 当前高级属性 */
  attributes?: AdvancedAttributes;
  /** 褶皱倍数 */
  foldRatio?: number;
  /** 加工费 */
  processFee?: number;
  /** 备注 */
  remark?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否展开 */
  isExpanded: boolean;
  /** 展开/折叠切换 */
  onToggle: () => void;
  /** 保存成功回调 */
  onSave?: () => void;
  /** 列数（用于 colSpan） */
  middleCols?: number;
}

/**
 * 安装位置选项
 */
const INSTALL_POSITIONS = [
  { value: 'CURTAIN_BOX', label: '窗帘盒' },
  { value: 'INSIDE', label: '窗框内' },
  { value: 'OUTSIDE', label: '窗框外' },
];

/**
 * 算料方式选项
 */
const FORMULA_OPTIONS = [
  { value: 'FIXED_HEIGHT', label: '定高' },
  { value: 'FIXED_WIDTH', label: '定宽' },
];

/**
 * 上带方式选项
 */
const HEADER_TYPES = [
  { value: 'WRAPPED', label: '布包带' },
  { value: 'ATTACHED', label: '贴布带' },
];

/**
 * 底边处理选项
 */
const BOTTOM_TYPES = [
  { value: 'STANDARD', label: '标准底边' },
  { value: 'WIDE', label: '宽底边' },
  { value: 'WEIGHTED', label: '铅坠底' },
];

/**
 * 报价项行内展开组件
 * 显示高级参数编辑区域和附件列表
 */
export function QuoteItemExpandRow({
  itemId,
  category,
  attributes = {},
  foldRatio = 2,
  processFee: _processFee = 0,
  remark = '',
  readOnly = false,
  isExpanded,
  onToggle,
  onSave,
  middleCols = 4,
}: QuoteItemExpandRowProps) {
  const [editedAttrs, setEditedAttrs] = useState<AdvancedAttributes>(attributes);
  const [editedFoldRatio, setEditedFoldRatio] = useState(foldRatio);
  const [editedRemark, setEditedRemark] = useState(remark);

  const isCurtain = ['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER'].includes(category);

  /**
   * 更新属性值
   */
  const updateAttr = useCallback((key: string, value: unknown) => {
    setEditedAttrs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleAutoSave = async (
    updates: Partial<{ attrs: AdvancedAttributes; foldRatio: number; remark: string }> = {}
  ) => {
    const nextAttrs = updates.attrs ?? editedAttrs;
    const nextFoldRatio = updates.foldRatio ?? editedFoldRatio;
    const nextRemark = updates.remark ?? editedRemark;

    try {
      const mergedAttrs = {
        ...nextAttrs,
        fabricWidth: nextAttrs.fabricWidth ? Number(nextAttrs.fabricWidth) : undefined,
        sideLoss: nextAttrs.sideLoss !== undefined ? Number(nextAttrs.sideLoss) : undefined,
        bottomLoss: nextAttrs.bottomLoss !== undefined ? Number(nextAttrs.bottomLoss) : undefined,
        headerLoss: nextAttrs.headerLoss !== undefined ? Number(nextAttrs.headerLoss) : undefined,
        groundClearance:
          nextAttrs.groundClearance !== undefined ? Number(nextAttrs.groundClearance) : undefined,
      };

      // Zod safeAttrValue does not allow undefined. Strip undefined values.
      const cleanAttrs = Object.fromEntries(
        Object.entries(mergedAttrs).filter(([_, v]) => v !== undefined)
      );

      const res = await updateQuoteItem({
        id: itemId,
        foldRatio: isCurtain ? nextFoldRatio : undefined,
        remark: nextRemark || undefined,
        attributes: cleanAttrs as Record<string, unknown>,
      });

      if (res?.error) {
        toast.error('自动保存失败: 参数有误');
        logger.error('Auto save validation failed:', res.error);
        return;
      }
      onSave?.();
    } catch (error) {
      toast.error('自动保存失败');
      logger.error('Auto save failed:', error);
    }
  };

  /**
   * 更新属性值并在选择变动时立刻保存
   */
  const updateAttrAndSave = (key: string, value: unknown) => {
    const nextAttrs = { ...editedAttrs, [key]: value };
    setEditedAttrs(nextAttrs);
    handleAutoSave({ attrs: nextAttrs });
  };

  if (!isExpanded) {
    return null;
  }

  // 计算渲染的空白占位 td 以修复列对齐
  // 我们默认使用 4 个列的单元格来展示前两行。如果 middleCols 大于 4，我们要在每一行尾部补充空的 td，保证表格行不会塌缩。
  const extraCols = Math.max(0, middleCols - 4);

  // 如果不是窗帘类，直接只占一行显示备注
  if (!isCurtain) {
    return (
      <tr className="group/advanced relative border-b bg-slate-50/40 last:border-b-0 dark:bg-slate-900/40">
        <td colSpan={middleCols} className="border-border/50 border-x p-4 align-top">
          <div className="w-full space-y-1.5">
            <Label className="text-muted-foreground text-xs font-semibold">备注</Label>
            <Input
              value={editedRemark}
              onChange={(e) => setEditedRemark(e.target.value)}
              onBlur={() => handleAutoSave({ remark: editedRemark })}
              placeholder="请输入关于此项的特殊要求、制作说明等备注信息..."
              className="h-8 text-sm"
              disabled={readOnly}
            />
          </div>
        </td>
      </tr>
    );
  }

  const isCustomPanel = editedAttrs.openingStyle === 'CUSTOM';

  return (
    <>
      {/* 展开内容的第一行 (Row 1) */}
      <tr className="group/advanced border-border/50 relative border-b border-dashed bg-slate-50/40 shadow-inner dark:bg-slate-900/40">
        {/* Param 1: 幅宽 */}
        <td className="border-border/50 border-l p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">幅宽</Label>
            <div className="relative">
              <Input
                type="number"
                onFocus={(e) => e.target.select()}
                value={editedAttrs.fabricWidth || ''}
                onChange={(e) => updateAttr('fabricWidth', e.target.value)}
                onBlur={() => handleAutoSave()}
                placeholder="280"
                className="h-8 w-full pr-8 text-sm"
                disabled={readOnly}
              />
              <span className="text-muted-foreground absolute top-2 right-2 text-xs">cm</span>
            </div>
          </div>
        </td>

        {/* Param 2: 拉动方式 */}
        <td className="p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">拉动方式</Label>
            <Select
              value={editedAttrs.openingStyle || 'SPLIT'}
              onValueChange={(v) => {
                const nextAttrs = { ...editedAttrs, openingStyle: v };
                if (
                  v === 'CUSTOM' &&
                  (!editedAttrs.customPanels ||
                    !Array.isArray(editedAttrs.customPanels) ||
                    (editedAttrs.customPanels as { width: number }[]).length === 0)
                ) {
                  nextAttrs.customPanels = [{ width: 150 }, { width: 150 }];
                }
                setEditedAttrs(nextAttrs);
                handleAutoSave({ attrs: nextAttrs });
              }}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SPLIT">对开</SelectItem>
                <SelectItem value="SINGLE_LEFT">左单开</SelectItem>
                <SelectItem value="SINGLE_RIGHT">右单开</SelectItem>
                <SelectItem value="CUSTOM">自定义选项</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </td>

        {/* Param 3: 安装位置 */}
        <td className="p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">安装位置</Label>
            <Select
              value={editedAttrs.installPosition || 'CURTAIN_BOX'}
              onValueChange={(v) => updateAttrAndSave('installPosition', v)}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTALL_POSITIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </td>

        {/* Param 4: 离地高度 */}
        <td className="border-border/50 border-r p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">离地高度</Label>
            <div className="relative">
              <Input
                type="number"
                onFocus={(e) => e.target.select()}
                value={editedAttrs.groundClearance ?? 2}
                onChange={(e) => updateAttr('groundClearance', e.target.value)}
                onBlur={() => handleAutoSave()}
                className="h-8 w-full pr-8 text-sm"
                disabled={readOnly}
              />
              <span className="text-muted-foreground absolute top-2 right-2 text-xs">cm</span>
            </div>
          </div>
        </td>

        {extraCols > 0 &&
          Array.from({ length: extraCols }).map((_, i) => (
            <td key={`extra-1-${i}`} className="border-border/50 border-r p-3"></td>
          ))}
      </tr>

      {/* 展开内容的第二行 (Row 2) */}
      <tr className="group/advanced border-border/50 relative border-b border-dashed bg-slate-50/40 dark:bg-slate-900/40">
        {/* Param 5: 褶皱倍数 */}
        <td className="border-border/50 border-l p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">褶皱倍数</Label>
            <Input
              type="number"
              step="0.1"
              onFocus={(e) => e.target.select()}
              value={editedFoldRatio}
              onChange={(e) => setEditedFoldRatio(Number(e.target.value))}
              onBlur={() => handleAutoSave({ foldRatio: editedFoldRatio })}
              className="h-8 w-full text-sm"
              disabled={readOnly}
            />
          </div>
        </td>

        {/* Param 6: 算料方式 */}
        <td className="p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">算料方式</Label>
            <Select
              value={editedAttrs.formula || 'FIXED_HEIGHT'}
              onValueChange={(v) => updateAttrAndSave('formula', v)}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMULA_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </td>

        {/* Param 7: 底边 */}
        <td className="p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">底边</Label>
            <Select
              value={editedAttrs.bottomType || 'STANDARD'}
              onValueChange={(v) => updateAttrAndSave('bottomType', v)}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOTTOM_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </td>

        {/* Param 8: 上带方式 */}
        <td className="border-border/50 border-r p-3 align-top">
          <div className="w-full space-y-1.5 pr-4">
            <Label className="text-muted-foreground text-xs font-semibold">上带方式</Label>
            <Select
              value={editedAttrs.headerType || 'WRAPPED'}
              onValueChange={(v) => updateAttrAndSave('headerType', v)}
              disabled={readOnly}
            >
              <SelectTrigger className="h-8 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEADER_TYPES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </td>

        {extraCols > 0 &&
          Array.from({ length: extraCols }).map((_, i) => (
            <td key={`extra-2-${i}`} className="border-border/50 border-r p-3"></td>
          ))}
      </tr>

      {/* 展开内容的第三行 (Row 3, Optional: Custom Panels) */}
      {isCustomPanel &&
        (() => {
          const panels = Array.isArray(editedAttrs.customPanels)
            ? (editedAttrs.customPanels as { width: number }[])
            : [{ width: 0 }, { width: 0 }];

          const updatePanel = (index: number, width: number) => {
            const newPanels = [...panels];
            newPanels[index] = { width };
            updateAttr('customPanels', newPanels);
          };
          const savePanels = () => {
            handleAutoSave();
          };
          const addPanel = () => {
            const newPanels = [...panels, { width: 0 }];
            updateAttr('customPanels', newPanels);
            handleAutoSave({ attrs: { ...editedAttrs, customPanels: newPanels } });
          };
          const removePanel = (index: number) => {
            if (panels.length <= 1) return;
            const newPanels = panels.filter((_, i) => i !== index);
            updateAttr('customPanels', newPanels);
            handleAutoSave({ attrs: { ...editedAttrs, customPanels: newPanels } });
          };

          return (
            <tr className="group/advanced border-border/50 relative border-b border-dashed bg-slate-50/40 dark:bg-slate-900/40">
              <td colSpan={middleCols} className="border-border/50 border-x p-4 align-top">
                <div className="space-y-3 rounded-lg border border-dashed bg-[var(--background)] p-4">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    各片宽度 (cm)，高度和褶皱倍数共用
                  </Label>
                  <div className="grid grid-cols-4 gap-4">
                    {panels.map((panel, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-md border bg-white p-2 shadow-sm dark:bg-slate-950"
                      >
                        <span className="w-10 shrink-0 text-xs font-medium text-slate-500">
                          第{index + 1}片
                        </span>
                        <Input
                          type="number"
                          className="h-8 flex-1 border-none px-1 text-sm shadow-none focus-visible:ring-0"
                          value={panel.width || ''}
                          onChange={(e) => updatePanel(index, Number(e.target.value))}
                          onBlur={savePanels}
                          placeholder="宽度"
                          disabled={readOnly}
                        />
                        <span className="text-muted-foreground text-xs">cm</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive h-6 w-6 shrink-0 p-0"
                          onClick={() => removePanel(index)}
                          disabled={panels.length <= 1 || readOnly}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    {!readOnly && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-muted-foreground hover:text-primary h-full min-h-[42px] border-dashed text-xs"
                        onClick={addPanel}
                      >
                        + 添加一片
                      </Button>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          );
        })()}

      {/* 展开内容的最后一行 (Row 4 or 3: Remark & Collapse Button) */}
      <tr className="group/advanced border-border/50 relative border-b bg-slate-50/40 last:border-b-0 dark:bg-slate-900/40">
        <td colSpan={middleCols} className="border-border/50 border-x p-0">
          <div className="p-3 px-4">
            <div className="w-full space-y-1.5">
              <Label className="text-muted-foreground text-xs font-semibold">备注</Label>
              <Input
                value={editedRemark}
                onChange={(e) => setEditedRemark(e.target.value)}
                onBlur={() => handleAutoSave({ remark: editedRemark })}
                placeholder="请输入关于此项的特殊要求、制作说明等备注信息..."
                className="h-8 text-sm"
                disabled={readOnly}
              />
            </div>

            {/* 折叠按钮 */}
            <div className="flex justify-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-muted-foreground gap-1 text-xs"
              >
                <ChevronUp className="h-3 w-3" />
                收起
              </Button>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}

/**
 * 展开按钮组件
 * 用于在表格行中添加展开/折叠触发器
 */
export function ExpandButton({
  isExpanded,
  onToggle,
  className,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('h-6 w-6', className)}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      title={isExpanded ? '收起高级配置' : '展开高级配置'}
    >
      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </Button>
  );
}
