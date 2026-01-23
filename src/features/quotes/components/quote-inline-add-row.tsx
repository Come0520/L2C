'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TableRow, TableCell } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { ProductAutocomplete } from './product-autocomplete';
import { ProductPickerDialog } from './product-picker-dialog';
import { createQuoteItem } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import type { ProductSearchResult } from '@/features/quotes/actions/product-actions';

interface QuoteInlineAddRowProps {
    /** 报价单 ID */
    quoteId: string;
    /** 空间 ID（可选） */
    roomId?: string | null;
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
    category,
    allowedCategories,
    onSuccess,
    readOnly = false,
    showFold = false,
    showProcessFee = false,
    showRemark = false,
}: QuoteInlineAddRowProps) {
    // 是否处于编辑模式
    const [isEditing, setIsEditing] = useState(false);
    // 是否正在提交
    const [isSubmitting, setIsSubmitting] = useState(false);
    // 增强搜索对话框状态（双击打开）
    const [pickerOpen, setPickerOpen] = useState(false);
    // 宽度输入框引用（用于焦点控制）
    const widthInputRef = useRef<HTMLInputElement>(null);

    /**
     * 处理商品选择
     */
    const handleProductSelect = useCallback(async (product: ProductSearchResult) => {
        setIsSubmitting(true);
        try {
            await createQuoteItem({
                quoteId,
                roomId: roomId || undefined,
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
            console.error('添加商品失败:', error);
            toast.error('添加商品失败');
        } finally {
            setIsSubmitting(false);
        }
    }, [quoteId, roomId, category, onSuccess]);

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
    const colSpan = 7 + (showFold ? 1 : 0) + (showProcessFee ? 1 : 0) + (showRemark ? 1 : 0);

    // 如果是只读模式，不渲染任何内容（放在所有 hooks 之后）
    if (readOnly) return null;

    // 始终渲染：编辑行（如果处于编辑模式）+ 添加商品按钮
    return (
        <>
            {/* 编辑状态：显示可编辑行 */}
            {isEditing && (
                <TableRow className="bg-primary/5 border-dashed animate-in fade-in duration-200">
                    {/* 商品名称 - 搜索框 */}
                    <TableCell className="p-2">
                        <div className="flex items-center gap-2">
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
                            {isSubmitting && (
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            )}
                        </div>
                    </TableCell>

                    {/* 尺寸 */}
                    <TableCell className="p-2">
                        <div className="flex items-center space-x-1">
                            <Input
                                ref={widthInputRef}
                                type="number"
                                className="w-16 h-8 text-right px-1 bg-white/50"
                                placeholder="宽"
                                disabled
                            />
                            <span className="text-muted-foreground text-xs">x</span>
                            <Input
                                type="number"
                                className="w-16 h-8 text-right px-1 bg-white/50"
                                placeholder="高"
                                disabled
                            />
                        </div>
                    </TableCell>

                    {/* 褶皱倍数 */}
                    {showFold && (
                        <TableCell className="p-2">
                            <Input
                                type="number"
                                className="w-14 h-8 text-right px-1 bg-white/50"
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
                                className="w-16 h-8 text-right px-1 bg-white/50"
                                placeholder="工费"
                                disabled
                            />
                        </TableCell>
                    )}

                    {/* 数量 */}
                    <TableCell className="p-2">
                        <Input
                            type="number"
                            className="w-16 h-8 text-right px-1 bg-white/50"
                            placeholder="1"
                            disabled
                        />
                    </TableCell>

                    {/* 单价 */}
                    <TableCell className="text-right p-2">
                        <Input
                            type="number"
                            className="w-20 h-8 text-right px-1 bg-white/50"
                            placeholder="0.00"
                            disabled
                        />
                    </TableCell>

                    {/* 小计 */}
                    <TableCell className="text-right font-medium p-2">
                        <span className="font-mono text-muted-foreground">¥0.00</span>
                    </TableCell>

                    {/* 备注 */}
                    {showRemark && (
                        <TableCell className="p-2">
                            <Input
                                className="w-24 h-8 bg-white/50 text-xs px-2"
                                placeholder="备注"
                                disabled
                            />
                        </TableCell>
                    )}

                    {/* 操作列 */}
                    <TableCell className="p-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={handleCancel}
                        >
                            取消
                        </Button>
                    </TableCell>
                </TableRow>
            )}

            {/* 添加商品按钮 - 始终显示 */}
            <TableRow className="hover:bg-transparent border-dashed border-t">
                <TableCell colSpan={colSpan} className="p-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary gap-1.5 h-8"
                        onClick={() => setIsEditing(true)}
                        disabled={isEditing}
                    >
                        <Plus className="w-4 h-4" />
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
