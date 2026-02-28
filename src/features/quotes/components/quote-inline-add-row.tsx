'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TableRow, TableCell } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import { ProductAutocomplete } from './product-autocomplete';
import { ProductPickerDialog } from './product-picker-dialog';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';
import { createQuoteItem } from '@/features/quotes/actions/quote-item-crud';
import { logger } from '@/shared/lib/logger';
import type { RoomData } from './quote-items-table/types';

interface QuoteInlineAddRowProps {
  /** 报价单 ID */
  quoteId: string;
  /** 空间 ID（可选） */
  roomId?: string | null;
  /** 所有空间数据（用于分类视图下选择空间） */
  rooms?: RoomData[];
  /** 商品品类筛选（单一品类） */
  category?: string;
  /** 允许的品类列表（用于限制可选商品范围） */
  allowedCategories?: string[];
  /** 添加成功后的回调 */
  onSuccess?: () => void;
  /** 是否只读模式 */
  readOnly?: boolean;
  /** 是否显示褶皱倍数列 */
  showFold?: boolean;
  /** 是否显示加工费列 */
  showProcessFee?: boolean;
  /** 是否显示备注列 */
  showRemark?: boolean;
  /** 是否显示宽列 */
  showWidth?: boolean;
  /** 是否显示高列 */
  showHeight?: boolean;
  /** 是否显示单位列 */
  showUnit?: boolean;
  /** 是否显示图片列 */
  showImage?: boolean;
}

/**
 * 报价单行内添加商品组件
 *
 * 功能：
 * 1. 初始状态显示"添加商品"按钮
 * 2. 点击后变为可编辑行，显示商品搜索框
 * 3. 选中商品后自动创建报价明细
 * 4. 创建成功后焦点自动转移到尺寸输入框
 */
export function QuoteInlineAddRow({
  quoteId,
  roomId,
  rooms,
  category,
  allowedCategories,
  onSuccess,
  readOnly = false,
  showFold = false,
  showProcessFee = false,
  showRemark = false,
  showWidth = false,
  showHeight = false,
  showUnit = true,
  showImage = false,
}: QuoteInlineAddRowProps) {
  // 是否处于编辑模式
  const [isEditing, setIsEditing] = useState(false);
  // 是否正在提交
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 增强搜索对话框状态（双击打开）
  const [pickerOpen, setPickerOpen] = useState(false);
  // 当未传入 roomId 却传入 rooms 时，说明可以在行内选择空间
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(roomId || null);
  // 宽度输入框引用（用于焦点控制）
  const widthInputRef = useRef<HTMLInputElement>(null);

  /**
   * 处理商品选择
   */
  const handleProductSelect = useCallback(
    async (product: ProductSearchResult) => {
      // 在分类视图下（传入了 rooms）强制要求选择空间
      if (!roomId && rooms && rooms.length > 0 && !selectedRoomId) {
        toast.error('请先选择商品所在的空间');
        return;
      }

      setIsSubmitting(true);
      try {
        await createQuoteItem({
          quoteId,
          roomId: roomId || selectedRoomId || undefined,
          category: product.category || category || 'STANDARD',
          productId: product.id,
          productName: product.name,
          unitPrice: product.unitPrice ? parseFloat(product.unitPrice) : 0,
          quantity: 1,
          width: 0,
          height: 0,
        });

        toast.success(`已添加：${product.name}`);
        setIsEditing(false);
        onSuccess?.();
      } catch (error) {
        logger.error('添加商品失败:', error);
        toast.error('添加商品失败');
      } finally {
        setIsSubmitting(false);
      }
    },
    [quoteId, roomId, category, onSuccess, rooms, selectedRoomId]
  );

  /**
   * 取消编辑
   */
  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 处理按 Escape 键取消
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        handleCancel();
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditing, handleCancel]);

  // 计算列数
  const colSpan =
    2 + // Name + Actions
    (showImage ? 1 : 0) +
    (showWidth || showHeight ? 1 : 0) +
    (showFold ? 1 : 0) +
    (showProcessFee ? 1 : 0) +
    1 + // Quantity
    (showUnit ? 1 : 0) + // Unit
    2 + // UnitPrice + Amount
    (showRemark ? 1 : 0);

  // 如果是只读模式，不渲染任何内容（放在所有 hooks 之后）
  if (readOnly) return null;

  // 始终渲染：编辑行（如果处于编辑模式）+ 添加商品按钮
  return (
    <>
      {/* 编辑状态：显示可编辑行 */}
      {isEditing && (
        <TableRow className="bg-primary/5 animate-in fade-in border-dashed duration-200">
          {/* 商品名称 - 搜索框 + 可选的空间选择器 */}
          <TableCell className="p-2">
            <div className="flex items-center gap-2">
              {/* 空间选择器（仅当未固定 roomId 且存在 rooms 可选时展示） */}
              {!roomId && rooms && rooms.length > 0 && (
                <div className="w-24 shrink-0">
                  <Select
                    value={selectedRoomId || undefined}
                    onValueChange={setSelectedRoomId}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-8 text-xs bg-white/50 border-dashed">
                      <SelectValue placeholder="空间" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id} className="text-xs">
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="w-48">
                <ProductAutocomplete
                  onSelect={handleProductSelect}
                  category={category}
                  allowedCategories={allowedCategories}
                  placeholder="搜索商品名称或编码..."
                  disabled={isSubmitting}
                  onDoubleClick={() => setPickerOpen(true)}
                />
              </div>
              {isSubmitting && <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />}
            </div>
          </TableCell>

          {/* 图片占位 */}
          {showImage && <TableCell className="p-2"></TableCell>}

          {/* 尺寸 */}
          {(showWidth || showHeight) && (
            <TableCell className="p-2">
              <div className="flex items-center space-x-1">
                {showWidth && (
                  <Input
                    ref={widthInputRef}
                    type="number"
                    className="h-8 w-16 bg-white/50 px-1 text-right"
                    placeholder="宽"
                    disabled
                  />
                )}
                {showWidth && showHeight && (
                  <span className="text-muted-foreground text-xs">x</span>
                )}
                {showHeight && (
                  <Input
                    type="number"
                    className="h-8 w-16 bg-white/50 px-1 text-right"
                    placeholder="高"
                    disabled
                  />
                )}
              </div>
            </TableCell>
          )}

          {/* 褶皱倍数 */}
          {showFold && (
            <TableCell className="p-2">
              <Input
                type="number"
                className="h-8 w-14 bg-white/50 px-1 text-right"
                placeholder="倍数"
                disabled
              />
            </TableCell>
          )}

          {/* 加工费 */}
          {showProcessFee && (
            <TableCell className="p-2">
              <Input
                type="number"
                className="h-8 w-16 bg-white/50 px-1 text-right"
                placeholder="工费"
                disabled
              />
            </TableCell>
          )}

          {/* 数量 */}
          <TableCell className="p-2">
            <Input
              type="number"
              className="h-8 w-16 bg-white/50 px-1 text-right"
              placeholder="1"
              disabled
            />
          </TableCell>

          {/* 单位 */}
          {showUnit && (
            <TableCell className="p-2">
              <Input className="h-8 w-12 bg-white/50 px-1 text-center" placeholder="-" disabled />
            </TableCell>
          )}

          {/* 单价 */}
          <TableCell className="p-2 text-right">
            <Input
              type="number"
              className="h-8 w-20 bg-white/50 px-1 text-right"
              placeholder="0.00"
              disabled
            />
          </TableCell>

          {/* 小计 */}
          <TableCell className="p-2 text-right font-medium">
            <span className="text-muted-foreground font-mono">¥0.00</span>
          </TableCell>

          {/* 备注 */}
          {showRemark && (
            <TableCell className="p-2">
              <Input className="h-8 w-24 bg-white/50 px-2 text-xs" placeholder="备注" disabled />
            </TableCell>
          )}

          {/* 操作列 */}
          <TableCell className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 text-xs"
              onClick={handleCancel}
            >
              取消
            </Button>
          </TableCell>
        </TableRow>
      )}

      {/* 添加商品按钮 - 始终显示 */}
      <TableRow className="border-t border-dashed hover:bg-transparent">
        <TableCell colSpan={colSpan} className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary h-8 gap-1.5"
            onClick={() => setIsEditing(true)}
            disabled={isEditing}
          >
            <Plus className="h-4 w-4" />
            添加商品
          </Button>
        </TableCell>
      </TableRow>

      {/* 增强搜索对话框（双击打开） */}
      <ProductPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleProductSelect}
        defaultCategory={category || allowedCategories?.[0]}
      />
    </>
  );
}
