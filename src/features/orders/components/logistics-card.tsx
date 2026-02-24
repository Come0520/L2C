'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import Truck from 'lucide-react/dist/esm/icons/truck';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import PenLine from 'lucide-react/dist/esm/icons/pen-line';
import { toast } from 'sonner';
import { updateLogistics } from '@/features/orders/actions';
import { format } from 'date-fns';

interface LogisticsTrace {
    time?: string;
    ftime?: string;
    content?: string;
    context?: string;
}

interface LogisticsData {
    company?: string;
    trackingNo?: string;
    status?: string;
    traces?: LogisticsTrace[];
    lastUpdatedAt?: string;
}

interface LogisticsCardProps {
    orderId: string;
    version: number;
    logistics: LogisticsData; // OrderLogisticsData
}

export function LogisticsCard({ orderId, version, logistics }: LogisticsCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [company, setCompany] = useState(logistics?.company || 'shunfeng');
    const [trackingNo, setTrackingNo] = useState(logistics?.trackingNo || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!trackingNo) return toast.error('请输入运单号');

        setLoading(true);
        try {
            const res = await updateLogistics({ orderId, company, trackingNo, version });
            if (res.success) {
                toast.success('物流信息已更新');
                setIsEditing(false);
                // In a real app, we might need router.refresh() here to re-fetch data
                window.location.reload();
            } else {
                toast.error('更新失败: ' + res.error);
            }
        } catch {
            toast.error('更新失败');
        } finally {
            setLoading(false);
        }
    };

    if (!logistics && !isEditing) {
        return (
            <Card className="shadow-sm border-border glass-panel">
                <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                    <h3 className="text-md font-semibold flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        物流信息
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <PenLine className="h-3 w-3 mr-1" /> 录入
                    </Button>
                </CardHeader>
                <CardContent className="pt-4 text-center text-slate-400 text-sm py-8">
                    暂无物流信息
                </CardContent>
            </Card>
        );
    }

    if (isEditing) {
        return (
            <Card className="shadow-sm border-border glass-panel">
                <CardHeader className="pb-3 border-b border-border">
                    <h3 className="text-md font-semibold flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        录入物流
                    </h3>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">快递公司</label>
                        <Select value={company} onValueChange={setCompany}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择快递" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="shunfeng">顺丰速运</SelectItem>
                                <SelectItem value="yuantong">圆通速递</SelectItem>
                                <SelectItem value="zhongtong">中通快递</SelectItem>
                                <SelectItem value="yunda">韵达快递</SelectItem>
                                <SelectItem value="deppon">德邦快递</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">运单号</label>
                        <Input
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            placeholder="输入运单号"
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>取消</Button>
                        <Button size="sm" onClick={handleUpdate} disabled={loading}>
                            {loading ? '保存中...' : '保存'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-sm border-border glass-panel">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
                <h3 className="text-md font-semibold flex items-center gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    物流跟踪
                </h3>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={handleUpdate} title="刷新轨迹">
                        <RefreshCw className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} title="修改单号">
                        <PenLine className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between text-sm bg-muted/10 p-2 rounded">
                    <div>
                        <span className="text-muted-foreground mr-2">单号:</span>
                        <span className="font-mono font-medium">{logistics.trackingNo}</span>
                    </div>
                    <div className="font-medium text-foreground">
                        {logistics.company === 'shunfeng' ? '顺丰' : logistics.company}
                    </div>
                </div>

                {/* Timeline */}
                <div className="relative pl-4 border-l border-border ml-2 space-y-6 py-2">
                    {(logistics.traces || []).map((trace: LogisticsTrace, idx: number) => (
                        <div key={idx} className="relative">
                            <div className={`absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-background ${idx === 0 ? 'bg-primary' : 'bg-muted'}`} />
                            <div className="text-xs text-muted-foreground mb-0.5">
                                {trace.time || trace.ftime}
                            </div>
                            <div className={`text-sm ${idx === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {trace.context}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-[10px] text-slate-300 text-right pt-2">
                    Updated: {logistics.lastUpdatedAt ? format(new Date(logistics.lastUpdatedAt), 'MM-dd HH:mm') : '-'}
                </div>
            </CardContent>
        </Card>
    );
}
