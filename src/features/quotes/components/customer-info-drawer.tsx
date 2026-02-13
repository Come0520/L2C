'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { ChevronDown, ChevronUp, Phone, MapPin, User } from 'lucide-react';

interface CustomerInfo {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    /** 扩展信息 */
    email?: string;
    source?: string;
    notes?: string;
    projectName?: string;
    createdAt?: Date;
}

interface CustomerInfoDrawerProps {
    customer: CustomerInfo;
    /** 额外的 className */
    className?: string;
}

/**
 * 客户信息抽屉组件
 * 默认收起，仅显示姓名/电话/地址一行
 * 点击展开查看完整客户信息
 */
export function CustomerInfoDrawer({ customer, className }: CustomerInfoDrawerProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className={cn(
                'rounded-lg border bg-card transition-all duration-200',
                className
            )}
        >
            {/* 主行：始终显示 */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-6">
                    {/* 姓名 */}
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{customer.name}</span>
                    </div>

                    {/* 电话 */}
                    {customer.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{customer.phone}</span>
                        </div>
                    )}

                    {/* 地址 */}
                    {customer.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm truncate max-w-[200px]">{customer.address}</span>
                        </div>
                    )}
                </div>

                {/* 展开/收起按钮 */}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* 展开内容 */}
            {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {customer.email && (
                            <div>
                                <span className="text-xs text-muted-foreground block">邮箱</span>
                                <span className="text-sm">{customer.email}</span>
                            </div>
                        )}
                        {customer.source && (
                            <div>
                                <span className="text-xs text-muted-foreground block">来源渠道</span>
                                <span className="text-sm">{customer.source}</span>
                            </div>
                        )}
                        {customer.projectName && (
                            <div>
                                <span className="text-xs text-muted-foreground block">项目名称</span>
                                <span className="text-sm">{customer.projectName}</span>
                            </div>
                        )}
                        {customer.createdAt && (
                            <div>
                                <span className="text-xs text-muted-foreground block">创建时间</span>
                                <span className="text-sm">
                                    {new Date(customer.createdAt).toLocaleDateString('zh-CN')}
                                </span>
                            </div>
                        )}
                        {customer.notes && (
                            <div className="col-span-2 md:col-span-4">
                                <span className="text-xs text-muted-foreground block">备注</span>
                                <span className="text-sm">{customer.notes}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
