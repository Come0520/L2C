'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Trash2, Check } from 'lucide-react';
import { createQuoteItem, updateQuoteItem, deleteQuoteItem } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';

/**
 * 附件类型选项
 */
export const ATTACHMENT_TYPES = [
    { value: 'PILLOW', label: '抱枕', unit: '个' },
    { value: 'TASSEL', label: '绑带', unit: '对' },
    { value: 'VALANCE', label: '窗幔', unit: '米' },
    { value: 'HOOK', label: '挂钩', unit: '个' },
    { value: 'RING', label: '罗马环', unit: '个' },
    { value: 'FABRIC_TIE', label: '本布绑带', unit: '对' },
    { value: 'READY_TIE', label: '成品绑带', unit: '对' },
    { value: 'OTHER', label: '其他', unit: '个' },
] as const;

export type AttachmentType = typeof ATTACHMENT_TYPES[number]['value'];

/**
 * 附件行数据接口
 */
export interface AttachmentRowData {
    id?: string;
    parentId: string;           // 主商品 ID
    type: AttachmentType;       // 附件类型
    productId?: string;         // 商品 ID
    productName: string;        // 商品名称
    remark?: string;            // 备注
    quantity: number;           // 数量
    unit: string;               // 单位
    unitPrice: number;          // 单价
    subtotal: number;           // 小计
}

interface QuoteAttachmentRowProps {
    /** 报价单 ID */
    quoteId: string;
    /** 主商品 ID */
    parentId: string;
    /** 空间 ID */
    roomId: string | null;
    /** 附件数据（编辑模式） */
    attachment?: AttachmentRowData;
    /** 是否为新增模式 */
    isNew?: boolean;
    /** 是否只读 */
    readOnly?: boolean;
    /** 保存成功回调 */
    onSave?: () => void;
    /** 取消回调（新增模式） */
    onCancel?: () => void;
    /** 删除成功回调 */
    onDelete?: () => void;
}

/**
 * 附件子行组件
 * 用于在主商品下方添加/编辑附件
 */
export function QuoteAttachmentRow({
    quoteId,
    parentId,
    roomId,
    attachment,
    isNew = false,
    readOnly = false,
    onSave,
    onCancel,
    onDelete,
}: QuoteAttachmentRowProps) {
    // 表单状态
    const [type, setType] = useState<AttachmentType>(attachment?.type || 'PILLOW');
    const [productName, setProductName] = useState(attachment?.productName || '');
    const [productId, setProductId] = useState(attachment?.productId || '');
    const [remark, setRemark] = useState(attachment?.remark || '');
    const [quantity, setQuantity] = useState(attachment?.quantity || 1);
    const [unit, setUnit] = useState(attachment?.unit || '个');
    const [unitPrice, setUnitPrice] = useState(attachment?.unitPrice || 0);
    const [loading, setLoading] = useState(false);

    // 计算小计
    const subtotal = quantity * unitPrice;

    /**
     * 类型变更时更新单位
     */
    const handleTypeChange = useCallback((newType: AttachmentType) => {
        setType(newType);
        const typeConfig = ATTACHMENT_TYPES.find(t => t.value === newType);
        if (typeConfig) {
            setUnit(typeConfig.unit);
            // 如果商品名称为空，设置默认名称
            if (!productName) {
                setProductName(typeConfig.label);
            }
        }
    }, [productName]);

    /**
     * 商品选择处理（预留接口）
     */
    const _handleProductSelect = useCallback((product: { id: string; name: string; price?: number }) => {
        setProductId(product.id);
        setProductName(product.name);
        if (product.price) {
            setUnitPrice(product.price);
        }
    }, []);

    /**
     * 保存附件
     */
    const handleSave = async () => {
        if (!productName.trim()) {
            toast.error('请输入商品名称');
            return;
        }

        setLoading(true);
        try {
            if (isNew || !attachment?.id) {
                // 新增附件
                await createQuoteItem({
                    quoteId,
                    roomId: roomId || undefined,
                    parentId,
                    category: 'CURTAIN_ACCESSORY',
                    productId: productId || undefined,
                    productName,
                    quantity,
                    unitPrice,
                    remark: remark || undefined,
                    attributes: {
                        attachmentType: type,
                    },
                });
                toast.success('附件已添加');
            } else {
                // 更新附件
                await updateQuoteItem({
                    id: attachment.id,
                    quantity,
                    unitPrice,
                    remark: remark || undefined,
                    attributes: {
                        attachmentType: type,
                    },
                });
                toast.success('附件已更新');
            }
            onSave?.();
        } catch (error) {
            toast.error('操作失败');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 删除附件
     */
    const handleDelete = async () => {
        if (!attachment?.id) return;

        setLoading(true);
        try {
            await deleteQuoteItem({ id: attachment.id });
            toast.success('附件已删除');
            onDelete?.();
        } catch (error) {
            toast.error('删除失败');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(
            "grid grid-cols-[100px_1fr_100px_70px_60px_80px_90px_70px] gap-2 items-center px-3 py-2",
            "border-t bg-muted/20",
            isNew && "border-dashed border-primary/30 bg-primary/5"
        )}>
            {/* 附件类型下拉 */}
            <Select value={type} onValueChange={handleTypeChange} disabled={readOnly}>
                <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {ATTACHMENT_TYPES.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 商品搜索/名称 */}
            {readOnly ? (
                <span className="text-sm truncate">{productName}</span>
            ) : (
                <div className="flex items-center gap-1">
                    <Input
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="输入或搜索商品..."
                        className="h-8 text-sm flex-1"
                    />
                </div>
            )}

            {/* 备注 */}
            <Input
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="备注"
                className="h-8 text-xs"
                disabled={readOnly}
            />

            {/* 数量 */}
            <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="h-8 text-sm text-right"
                disabled={readOnly}
            />

            {/* 单位 */}
            <span className="text-sm text-center text-muted-foreground">{unit}</span>

            {/* 单价 */}
            <Input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                className="h-8 text-sm text-right"
                disabled={readOnly}
            />

            {/* 小计 */}
            <span className="text-sm text-right font-medium">
                ¥{subtotal.toFixed(2)}
            </span>

            {/* 操作按钮 */}
            <div className="flex items-center justify-end gap-1">
                {!readOnly && (
                    <>
                        {isNew ? (
                            <>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-primary hover:bg-primary/10"
                                    onClick={handleSave}
                                    disabled={loading}
                                    title="保存"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-muted-foreground hover:bg-muted"
                                    onClick={onCancel}
                                    disabled={loading}
                                    title="取消"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={handleDelete}
                                disabled={loading}
                                title="删除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * 添加附件按钮组件
 */
export function AddAttachmentButton({
    onClick,
    className,
}: {
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-primary",
                "border border-dashed border-muted-foreground/30 hover:border-primary/50 rounded",
                "transition-colors w-full justify-center",
                className
            )}
        >
            <span>+ 添加附件</span>
        </button>
    );
}
