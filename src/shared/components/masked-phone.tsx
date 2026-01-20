'use client';

/**
 * 手机号脱敏组件 (Masked Phone)
 * 默认展示脱敏后的手机号，点击后根据权限显示完整号码
 */

import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/ui/dialog';
import { Eye, Copy, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface MaskedPhoneProps {
    /** 原始手机号 */
    phone: string;
    /** 客户ID，用于日志记录 */
    customerId: string;
    /** 当前用户是否有权限查看完整号码 */
    canViewFull?: boolean;
    /** 查看完整号码时的回调（用于记录日志） */
    onViewFull?: (customerId: string) => Promise<void>;
    /** 是否显示拨打按钮 */
    showCallButton?: boolean;
    /** 自定义 className */
    className?: string;
}

/**
 * 脱敏手机号
 * 138****1234 格式
 */
function maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return phone;
    const start = phone.slice(0, 3);
    const end = phone.slice(-4);
    return `${start}****${end}`;
}

export function MaskedPhone({
    phone,
    customerId,
    canViewFull = false,
    onViewFull,
    showCallButton = false,
    className,
}: MaskedPhoneProps) {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const maskedPhone = maskPhone(phone);

    // 处理查看完整号码
    const handleReveal = async () => {
        if (!canViewFull) {
            toast.error('您没有权限查看完整手机号');
            return;
        }

        setIsLoading(true);
        try {
            // 记录查看日志
            if (onViewFull) {
                await onViewFull(customerId);
            }
            setIsRevealed(true);
            setIsDialogOpen(false);
            toast.success('已获取完整手机号');
        } catch {
            toast.error('获取手机号失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 复制手机号
    const handleCopy = () => {
        if (!isRevealed && !canViewFull) {
            toast.error('您没有权限复制完整手机号');
            return;
        }
        navigator.clipboard.writeText(phone);
        toast.success('已复制到剪贴板');
    };

    // 拨打电话
    const handleCall = () => {
        if (!isRevealed && !canViewFull) {
            toast.error('您没有权限拨打此号码');
            return;
        }
        window.location.href = `tel:${phone}`;
    };

    return (
        <>
            <div className={`inline-flex items-center gap-1 ${className || ''}`}>
                <span
                    className={`font-mono ${canViewFull ? 'cursor-pointer hover:text-primary' : ''}`}
                    onClick={() => canViewFull && !isRevealed && setIsDialogOpen(true)}
                    title={canViewFull ? '点击查看完整号码' : '无权限查看'}
                >
                    {isRevealed ? phone : maskedPhone}
                </span>

                {canViewFull && !isRevealed && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setIsDialogOpen(true)}
                        title="查看完整号码"
                    >
                        <Eye className="h-3 w-3" />
                    </Button>
                )}

                {isRevealed && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={handleCopy}
                            title="复制"
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                        {showCallButton && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={handleCall}
                                title="拨打"
                            >
                                <Phone className="h-3 w-3" />
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* 确认弹窗 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>查看完整手机号</DialogTitle>
                        <DialogDescription>
                            您正在查看客户的完整联系方式，此操作将被记录。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 text-center">
                        <p className="text-2xl font-mono text-muted-foreground">
                            {maskedPhone}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleReveal}
                            disabled={isLoading}
                        >
                            {isLoading ? '加载中...' : '确认查看'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
