'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { AlertTriangle, Check } from 'lucide-react';
import type { AlternativeSolution } from '../calc-strategies/types';

/**
 * 超高方案对比弹窗 Props
 */
interface HeightOverflowDialogProps {
    /** 是否打开 */
    open: boolean;
    /** 关闭回调 */
    onOpenChange: (open: boolean) => void;
    /** 替代方案列表 */
    alternatives: AlternativeSolution[];
    /** 基准用料（用于计算差价） */
    baseQuantity: number;
    /** 单价 */
    unitPrice: number;
    /** 选择方案回调 */
    onSelectSolution: (solution: AlternativeSolution) => void;
    /** 忽略并继续 */
    onIgnore?: () => void;
}

/**
 * 超高方案对比弹窗
 * 当窗帘高度超过面料幅宽限制时，展示多种替代方案对比
 */
export function HeightOverflowDialog({
    open,
    onOpenChange,
    alternatives,
    baseQuantity,
    unitPrice,
    onSelectSolution,
    onIgnore,
}: HeightOverflowDialogProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleConfirm = () => {
        if (selectedIndex !== null && alternatives[selectedIndex]) {
            onSelectSolution(alternatives[selectedIndex]);
            onOpenChange(false);
        }
    };

    const handleIgnore = () => {
        onIgnore?.();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-5 w-5" />
                        高度超限预警
                    </DialogTitle>
                    <DialogDescription>
                        成品高度超过面料可用高度，请选择一种解决方案
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {alternatives.map((solution, index) => {
                        const isSelected = selectedIndex === index;
                        const priceDiff = (solution.quantity - baseQuantity) * unitPrice;

                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedIndex(index)}
                                className={`
                                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                                    ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted hover:border-primary/50'
                                    }
                                `}
                            >
                                {/* 推荐标签 */}
                                {solution.recommended && (
                                    <Badge className="absolute -top-2 right-4 bg-green-500">
                                        推荐
                                    </Badge>
                                )}

                                {/* 选中指示 */}
                                {isSelected && (
                                    <div className="absolute top-4 right-4">
                                        <Check className="h-5 w-5 text-primary" />
                                    </div>
                                )}

                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="font-medium text-base">
                                            {index + 1}. {solution.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {solution.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">帘头工艺</span>
                                        <p className="font-medium">
                                            {solution.headerType === 'WRAPPED' ? '包布带' : '贴布带'}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">帘头损耗</span>
                                        <p className="font-medium">{solution.headerLoss}cm</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">用料</span>
                                        <p className="font-medium">{solution.quantity}m</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">差价</span>
                                        <p className={`font-medium ${priceDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {priceDiff > 0 ? '+' : ''}{priceDiff.toFixed(0)} 元
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={handleIgnore}>
                        我知道了，继续
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={selectedIndex === null}
                    >
                        应用选中方案
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
