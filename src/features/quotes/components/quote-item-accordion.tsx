'use client';

import { useState, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash';
import CornerDownRight from 'lucide-react/dist/esm/icons/corner-down-right';

/**
 * 商品项数据结构
 */
export interface QuoteItemData {
    id: string;
    productName: string;
    width?: number | string;
    height?: number | string;
    foldRatio?: number | string;
    quantity?: number | string;
    unitPrice?: number | string;
    subtotal?: number | string;
    processFee?: number | string;
    remark?: string;
    /** 高级参数 */
    attributes?: {
        fabricWidth?: number;    // 幅宽
        material?: string;       // 材质
        weight?: number;         // 克重
        patternRepeat?: number;  // 花距
        installPosition?: string; // 安装位置
        groundClearance?: number; // 离地高度
        discount?: number;       // 折扣
        productImage?: string;
        [key: string]: unknown;
    };
    /** 附件列表 */
    children?: QuoteItemData[];
}

interface QuoteItemAccordionProps {
    /** 商品数据 */
    item: QuoteItemData;
    /** 是否展开高级参数 */
    isExpanded?: boolean;
    /** 是否只读 */
    readOnly?: boolean;
    /** 父级商品（如果是附件） */
    isAccessory?: boolean;
    /** 更新商品回调 */
    onUpdate?: (id: string, data: Partial<QuoteItemData>) => void;
    /** 删除商品回调 */
    onDelete?: (id: string) => void;
    /** 添加附件回调 */
    onAddAccessory?: (parentId: string) => void;
    /** 额外的 className */
    className?: string;
}

/**
 * 商品行抽屉组件
 * 支持快速/高级模式切换，展开显示完整参数
 */
export function QuoteItemAccordion({
    item,
    isExpanded: initialExpanded = false,
    readOnly = false,
    isAccessory = false,
    onUpdate,
    onDelete,
    onAddAccessory,
    className,
}: QuoteItemAccordionProps) {
    const [isExpanded, setIsExpanded] = useState(initialExpanded);

    // 格式化金额
    const formatAmount = (amount: number | string | undefined): string => {
        if (amount === undefined || amount === null) return '0.00';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // 计算商品小计（含附件）
    const calculateItemSubtotal = (): number => {
        const mainSubtotal = parseFloat(String(item.subtotal || 0));
        const accessoriesTotal = (item.children || []).reduce((sum, child) => {
            return sum + parseFloat(String(child.subtotal || 0));
        }, 0);
        return mainSubtotal + accessoriesTotal;
    };

    return (
        <div className={cn('border rounded-lg overflow-hidden', className)}>
            {/* 主商品行 - 快速模式显示 */}
            <div
                className={cn(
                    'flex items-center gap-2 px-3 py-2 bg-card transition-colors',
                    !readOnly && 'hover:bg-accent/50'
                )}
            >
                {/* 附件缩进标识 */}
                {isAccessory && (
                    <div className="flex items-center text-muted-foreground">
                        <CornerDownRight className="w-4 h-4" />
                    </div>
                )}

                {/* 商品名称 */}
                <div className="flex-1 min-w-0">
                    <span className="font-medium truncate block">{item.productName}</span>
                </div>

                {/* 尺寸 */}
                <div className="w-28 text-sm text-muted-foreground text-center">
                    {item.width || '-'} × {item.height || '-'}
                </div>

                {/* 倍数 */}
                {!isAccessory && (
                    <div className="w-14 text-sm text-center">
                        {item.foldRatio || '-'}
                    </div>
                )}

                {/* 数量 */}
                <div className="w-16 text-sm text-center font-medium">
                    {item.quantity || '-'}
                </div>

                {/* 单价 */}
                <div className="w-20 text-sm text-right">
                    ¥{formatAmount(item.unitPrice)}
                </div>

                {/* 金额 */}
                <div className="w-24 text-sm text-right font-medium">
                    ¥{formatAmount(item.subtotal)}
                </div>

                {/* 展开/收起按钮 */}
                {!isAccessory && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </Button>
                )}

                {/* 删除按钮 */}
                {!readOnly && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete?.(item.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* 高级参数区 - 展开时显示 */}
            {isExpanded && !isAccessory && (
                <div className="border-t bg-muted/30 p-4 space-y-4">
                    {/* 高级参数 - 上下结构 */}
                    <div className="grid grid-cols-4 gap-4">
                        <AdvancedField
                            label="幅宽"
                            value={item.attributes?.fabricWidth}
                            suffix="cm"
                            readOnly={readOnly}
                        />
                        <AdvancedField
                            label="材质"
                            value={item.attributes?.material}
                            readOnly={readOnly}
                        />
                        <AdvancedField
                            label="克重"
                            value={item.attributes?.weight}
                            suffix="g/㎡"
                            readOnly={readOnly}
                        />
                        <AdvancedField
                            label="花距"
                            value={item.attributes?.patternRepeat}
                            suffix="cm"
                            readOnly={readOnly}
                        />
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <AdvancedField
                            label="安装位置"
                            value={item.attributes?.installPosition}
                            readOnly={readOnly}
                        />
                        <AdvancedField
                            label="离地高度"
                            value={item.attributes?.groundClearance}
                            suffix="cm"
                            readOnly={readOnly}
                        />
                        <AdvancedField
                            label="褶皱倍数"
                            value={item.foldRatio}
                            readOnly={readOnly}
                        />
                        <AdvancedField
                            label="折扣"
                            value={item.attributes?.discount}
                            suffix="%"
                            readOnly={readOnly}
                        />
                    </div>

                    {/* 备注 */}
                    <div>
                        <label className="text-xs text-muted-foreground block mb-1">备注</label>
                        <Input
                            value={item.remark || ''}
                            placeholder="输入备注"
                            disabled={readOnly}
                            onChange={(e) => onUpdate?.(item.id, { remark: e.target.value })}
                        />
                    </div>

                    {/* 附件区 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">附件</span>
                            {!readOnly && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAddAccessory?.(item.id)}
                                    className="h-7 gap-1"
                                >
                                    <Plus className="h-3 w-3" />
                                    添加附件
                                </Button>
                            )}
                        </div>

                        {(item.children && item.children.length > 0) ? (
                            <div className="space-y-1 pl-4 border-l-2 border-muted">
                                {item.children.map((child) => (
                                    <AccessoryRow
                                        key={child.id}
                                        item={child}
                                        readOnly={readOnly}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-2 border border-dashed rounded">
                                暂无附件
                            </div>
                        )}
                    </div>

                    {/* 商品小计（含附件） */}
                    <div className="flex justify-end pt-2 border-t">
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-muted-foreground">商品小计（含附件）</span>
                            <span className="text-lg font-bold text-primary">
                                ¥{calculateItemSubtotal().toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * 高级参数字段组件 - 上下结构
 */
function AdvancedField({
    label,
    value,
    suffix,
    readOnly,
}: {
    label: string;
    value?: string | number;
    suffix?: string;
    readOnly?: boolean;
}) {
    return (
        <div>
            <label className="text-xs text-muted-foreground block mb-1">{label}</label>
            {readOnly ? (
                <span className="text-sm">
                    {value ?? '-'}{value && suffix ? ` ${suffix}` : ''}
                </span>
            ) : (
                <Input
                    className="h-8"
                    defaultValue={value ?? ''}
                    placeholder={`输入${label}`}
                />
            )}
        </div>
    );
}

/**
 * 附件行组件 - 简化显示
 */
function AccessoryRow({
    item,
    readOnly,
    onDelete,
}: {
    item: QuoteItemData;
    readOnly?: boolean;
    onDelete?: (id: string) => void;
}) {
    return (
        <div className="flex items-center gap-2 py-1.5 px-2 bg-background/50 rounded text-sm">
            <CornerDownRight className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate">{item.productName}</span>
            <span className="w-16 text-center text-muted-foreground">{item.quantity || '-'}</span>
            <span className="w-16 text-right">¥{parseFloat(String(item.unitPrice || 0)).toFixed(0)}</span>
            <span className="w-16 text-right font-medium">¥{parseFloat(String(item.subtotal || 0)).toFixed(0)}</span>
            {!readOnly && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete?.(item.id)}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
