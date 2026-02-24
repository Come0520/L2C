'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import Save from 'lucide-react/dist/esm/icons/save';
import { updateQuoteItem } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';

import { QuoteItem as SharedQuoteItem } from '@/shared/api/schema/quotes';
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
  [key: string]: unknown;
}

/**
 * 附件行数据接口
 */
export interface AttachmentItem {
  id: string;
  type: string; // 附件类型
  productName: string; // 商品名称
  remark?: string; // 备注
  quantity: number; // 数量
  unit: string; // 单位
  unitPrice: number; // 单价
  subtotal: number; // 小计
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
  /** 附件列表 */
  attachments?: (SharedQuoteItem & { amount?: number })[];
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否展开 */
  isExpanded: boolean;
  /** 展开/折叠切换 */
  onToggle: () => void;
  /** 保存成功回调 */
  onSave?: () => void;
  /** 添加附件回调 */
  onAddAttachment?: () => void;
  /** 删除附件回调 */
  onDeleteAttachment?: (attachmentId: string) => void;
  /** 列数（用于 colSpan） */
  colSpan?: number;
}

/**
 * 附件类型选项
 */
const ATTACHMENT_TYPES = [
  { value: 'PILLOW', label: '抱枕' },
  { value: 'TASSEL', label: '绑带' },
  { value: 'VALANCE', label: '窗幔' },
  { value: 'HOOK', label: '挂钩' },
  { value: 'RING', label: '罗马环' },
  { value: 'OTHER', label: '其他' },
];

/**
 * 安装位置选项
 */
const INSTALL_POSITIONS = [
  { value: 'CURTAIN_BOX', label: '窗帘盒' },
  { value: 'INSIDE', label: '窗框内' },
  { value: 'OUTSIDE', label: '窗框外' },
];

/**
 * 拉动方式选项
 */
const OPENING_STYLES = [
  { value: 'SPLIT', label: '对开' },
  { value: 'SINGLE_LEFT', label: '单开左' },
  { value: 'SINGLE_RIGHT', label: '单开右' },
  { value: 'MULTI', label: '多开' },
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
  productName,
  category,
  attributes = {},
  foldRatio = 2,
  processFee: _processFee = 0,
  remark = '',
  attachments = [],
  readOnly = false,
  isExpanded,
  onToggle,
  onSave,
  onAddAttachment,
  onDeleteAttachment,
  colSpan = 10,
}: QuoteItemExpandRowProps) {
  const [loading, setLoading] = useState(false);
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

  /**
   * 保存高级配置
   */
  const handleSave = async () => {
    setLoading(true);
    try {
      await updateQuoteItem({
        id: itemId,
        foldRatio: isCurtain ? editedFoldRatio : undefined,
        remark: editedRemark || undefined,
        attributes: {
          ...editedAttrs,
          fabricWidth: editedAttrs.fabricWidth ? Number(editedAttrs.fabricWidth) : undefined,
          sideLoss: editedAttrs.sideLoss !== undefined ? Number(editedAttrs.sideLoss) : undefined,
          bottomLoss:
            editedAttrs.bottomLoss !== undefined ? Number(editedAttrs.bottomLoss) : undefined,
          headerLoss:
            editedAttrs.headerLoss !== undefined ? Number(editedAttrs.headerLoss) : undefined,
          groundClearance:
            editedAttrs.groundClearance !== undefined
              ? Number(editedAttrs.groundClearance)
              : undefined,
        } as Record<string, string | number | boolean | null>,
      });
      toast.success('配置已保存');
      onSave?.();
    } catch (error) {
      toast.error('保存失败');
      logger.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <tr className="bg-muted/30 border-t border-b border-dashed">
      <td colSpan={colSpan} className="p-0">
        <div className="animate-in slide-in-from-top-2 space-y-4 p-4 duration-200">
          {/* 高级参数区域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                📐 高级参数
                <span className="text-muted-foreground/70 text-xs">({productName})</span>
              </h4>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSave}
                  disabled={loading}
                  className="gap-1"
                >
                  <Save className="h-3 w-3" />
                  {loading ? '保存中...' : '保存'}
                </Button>
              )}
            </div>

            {/* 参数网格 - 窗帘类商品 */}
            {isCurtain && (
              <div className="grid grid-cols-8 gap-3">
                {/* 幅宽 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">幅宽</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={editedAttrs.fabricWidth || ''}
                      onChange={(e) => updateAttr('fabricWidth', e.target.value)}
                      placeholder="280"
                      className="h-8 pr-8 text-sm"
                      disabled={readOnly}
                    />
                    <span className="text-muted-foreground absolute top-2 right-2 text-xs">cm</span>
                  </div>
                </div>

                {/* 拉动方式 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">拉动方式</Label>
                  <Select
                    value={editedAttrs.openingStyle || 'SPLIT'}
                    onValueChange={(v) => updateAttr('openingStyle', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPENING_STYLES.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 安装位置 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">安装位置</Label>
                  <Select
                    value={editedAttrs.installPosition || 'CURTAIN_BOX'}
                    onValueChange={(v) => updateAttr('installPosition', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-sm">
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

                {/* 离地高度 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">离地高度</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={editedAttrs.groundClearance ?? 2}
                      onChange={(e) => updateAttr('groundClearance', e.target.value)}
                      className="h-8 pr-8 text-sm"
                      disabled={readOnly}
                    />
                    <span className="text-muted-foreground absolute top-2 right-2 text-xs">cm</span>
                  </div>
                </div>

                {/* 褶皱倍数 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">褶皱倍数</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editedFoldRatio}
                    onChange={(e) => setEditedFoldRatio(Number(e.target.value))}
                    className="h-8 text-sm"
                    disabled={readOnly}
                  />
                </div>

                {/* 算料方式 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">算料方式</Label>
                  <Select
                    value={editedAttrs.formula || 'FIXED_HEIGHT'}
                    onValueChange={(v) => updateAttr('formula', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-sm">
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

                {/* 底边 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">底边</Label>
                  <Select
                    value={editedAttrs.bottomType || 'STANDARD'}
                    onValueChange={(v) => updateAttr('bottomType', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-sm">
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

                {/* 上带方式 */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">上带方式</Label>
                  <Select
                    value={editedAttrs.headerType || 'WRAPPED'}
                    onValueChange={(v) => updateAttr('headerType', v)}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="h-8 text-sm">
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
              </div>
            )}

            {/* 备注 */}
            <div className="max-w-md">
              <Label className="text-muted-foreground text-xs">备注</Label>
              <Input
                value={editedRemark}
                onChange={(e) => setEditedRemark(e.target.value)}
                placeholder="请输入备注信息..."
                className="mt-1 h-8 text-sm"
                disabled={readOnly}
              />
            </div>
          </div>

          {/* 附件区域 */}
          <div className="space-y-2 border-t pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                📦 附件
                {attachments.length > 0 && (
                  <span className="bg-muted rounded px-1.5 py-0.5 text-xs">
                    {attachments.length}
                  </span>
                )}
              </h4>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onAddAttachment}
                  className="h-7 gap-1 text-xs"
                >
                  <Plus className="h-3 w-3" />
                  添加附件
                </Button>
              )}
            </div>

            {/* 附件列表表头 */}
            {attachments.length > 0 && (
              <div className="overflow-hidden rounded border">
                <div className="bg-muted/50 text-muted-foreground grid grid-cols-[120px_1fr_100px_80px_80px_80px_80px_40px] gap-2 px-3 py-2 text-xs font-medium">
                  <span>类型</span>
                  <span>商品名称</span>
                  <span>备注</span>
                  <span className="text-right">数量</span>
                  <span className="text-center">单位</span>
                  <span className="text-right">单价</span>
                  <span className="text-right">小计</span>
                  <span></span>
                </div>
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="grid grid-cols-[120px_1fr_100px_80px_80px_80px_80px_40px] items-center gap-2 border-t px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {ATTACHMENT_TYPES.find((t) => t.value === att.attributes?.attachmentType)?.label ||
                        att.attributes?.attachmentType ||
                        '辅料'}
                    </span>
                    <span className="truncate">{att.productName}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {att.remark || '-'}
                    </span>
                    <span className="text-right">{att.quantity}</span>
                    <span className="text-center">{att.unit}</span>
                    <span className="text-right">¥{att.unitPrice}</span>
                    <span className="text-right font-medium">¥{att.amount}</span>
                    {!readOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => onDeleteAttachment?.(att.id)}
                      >
                        <Trash2 className="text-destructive h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {attachments.length === 0 && (
              <div className="text-muted-foreground rounded border border-dashed py-4 text-center text-sm">
                暂无附件
              </div>
            )}
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
