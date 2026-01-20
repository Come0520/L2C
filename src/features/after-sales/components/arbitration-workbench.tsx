'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';
import { Textarea } from '@/shared/ui/textarea';
import {
    Scale,
    Clock,
    Image as ImageIcon,
    FileText,
    User,
    Building2,
    HardHat,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronRight,
    Gavel
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 仲裁/定责工作台组件
 * 
 * 功能：
 * 1. 左右分屏布局 - 左侧证据对比，右侧定责操作
 * 2. 时间轴展示事件流程
 * 3. 责任方选择和金额分配
 * 4. 证据材料上传和对比
 */

// 时间轴事件类型
interface TimelineEvent {
    id: string;
    timestamp: Date;
    type: 'order' | 'install' | 'complaint' | 'liability' | 'arbitration';
    title: string;
    description?: string;
    actor?: string;
    photos?: string[];
}

// 责任方信息
interface LiableParty {
    type: 'FACTORY' | 'INSTALLER' | 'SALES' | 'COMPANY';
    id?: string;
    name: string;
    amount: number;
    ratio: number;
}

interface ArbitrationWorkbenchProps {
    ticketId: string;
    ticketNo: string;
    orderId: string;
    orderNo: string;
    customerName: string;
    description: string;
    photos: string[];
    estimatedCost: number;
    timeline: TimelineEvent[];
    existingLiabilities?: LiableParty[];
    onSubmitArbitration?: (result: ArbitrationResult) => Promise<void>;
    onSave?: (draft: ArbitrationDraft) => Promise<void>;
}

interface ArbitrationResult {
    ticketId: string;
    liabilities: LiableParty[];
    arbitrationResult: string;
    totalAmount: number;
}

interface ArbitrationDraft {
    liabilities: LiableParty[];
    notes: string;
}

export function ArbitrationWorkbench({
    ticketId,
    ticketNo,
    orderNo,
    customerName,
    description,
    photos,
    estimatedCost,
    timeline,
    existingLiabilities = [],
    onSubmitArbitration,
    onSave,
}: ArbitrationWorkbenchProps) {
    const [liabilities, setLiabilities] = useState<LiableParty[]>(existingLiabilities);
    const [arbitrationNotes, setArbitrationNotes] = useState('');
    const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 计算总金额和剩余分配金额
    const totalAllocated = liabilities.reduce((sum, l) => sum + l.amount, 0);
    const remaining = estimatedCost - totalAllocated;

    // 添加责任方
    const addLiability = useCallback((type: LiableParty['type']) => {
        const typeNames = {
            FACTORY: '供应商',
            INSTALLER: '安装工',
            SALES: '销售',
            COMPANY: '公司',
        };
        setLiabilities(prev => [...prev, {
            type,
            name: typeNames[type],
            amount: remaining > 0 ? remaining : 0,
            ratio: remaining > 0 ? (remaining / estimatedCost) * 100 : 0,
        }]);
    }, [remaining, estimatedCost]);

    // 更新责任方金额
    const updateLiabilityAmount = useCallback((index: number, amount: number) => {
        setLiabilities(prev => prev.map((l, i) =>
            i === index ? { ...l, amount, ratio: (amount / estimatedCost) * 100 } : l
        ));
    }, [estimatedCost]);

    // 移除责任方
    const removeLiability = useCallback((index: number) => {
        setLiabilities(prev => prev.filter((_, i) => i !== index));
    }, []);

    // 提交仲裁
    const handleSubmit = async () => {
        if (!onSubmitArbitration) return;
        setIsSubmitting(true);
        try {
            await onSubmitArbitration({
                ticketId,
                liabilities,
                arbitrationResult: arbitrationNotes,
                totalAmount: totalAllocated,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // 责任方图标
    const PartyIcon = ({ type }: { type: LiableParty['type'] }) => {
        switch (type) {
            case 'FACTORY': return <Building2 className="h-4 w-4" />;
            case 'INSTALLER': return <HardHat className="h-4 w-4" />;
            case 'SALES': return <User className="h-4 w-4" />;
            case 'COMPANY': return <Building2 className="h-4 w-4 text-red-500" />;
            default: return <User className="h-4 w-4" />;
        }
    };

    // 事件类型颜色
    const eventTypeColor = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'order': return 'bg-blue-500';
            case 'install': return 'bg-green-500';
            case 'complaint': return 'bg-orange-500';
            case 'liability': return 'bg-red-500';
            case 'arbitration': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* 左侧：证据和时间轴 */}
            <div className="space-y-4">
                {/* 工单基本信息 */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Gavel className="h-5 w-5" />
                                仲裁工作台
                            </CardTitle>
                            <Badge variant="outline">{ticketNo}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">关联订单：</span>
                                <span className="font-medium">{orderNo}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">客户：</span>
                                <span className="font-medium">{customerName}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-muted-foreground">问题描述：</span>
                                <p className="mt-1">{description}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 时间轴 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            事件时间轴
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="relative space-y-4">
                                {/* 时间轴线 */}
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

                                {timeline.map((event, index) => (
                                    <div key={event.id} className="relative flex gap-4 pl-6">
                                        {/* 时间点 */}
                                        <div className={`absolute left-0 w-4 h-4 rounded-full ${eventTypeColor(event.type)} flex items-center justify-center`}>
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        </div>

                                        {/* 事件内容 */}
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{event.title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(event.timestamp, 'MM-dd HH:mm', { locale: zhCN })}
                                                </span>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                            )}
                                            {event.actor && (
                                                <p className="text-xs text-muted-foreground mt-1">操作人: {event.actor}</p>
                                            )}
                                            {event.photos && event.photos.length > 0 && (
                                                <div className="flex gap-2 mt-2">
                                                    {event.photos.map((photo, i) => (
                                                        <button
                                                            key={i}
                                                            className="w-12 h-12 rounded border overflow-hidden hover:ring-2 ring-primary"
                                                            onClick={() => setSelectedEvidence(photo)}
                                                        >
                                                            <img src={photo} alt={`证据${i + 1}`} className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* 证据材料 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            证据材料 ({photos.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                            {photos.map((photo, index) => (
                                <button
                                    key={index}
                                    className={`aspect-square rounded border overflow-hidden hover:ring-2 ring-primary ${selectedEvidence === photo ? 'ring-2' : ''
                                        }`}
                                    onClick={() => setSelectedEvidence(photo)}
                                >
                                    <img src={photo} alt={`证据${index + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 右侧：定责操作 */}
            <div className="space-y-4">
                {/* 责任分配 */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Scale className="h-4 w-4" />
                                责任分配
                            </CardTitle>
                            <Badge variant={remaining === 0 ? 'default' : 'destructive'}>
                                预估成本: ¥{estimatedCost.toLocaleString()}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* 已分配责任列表 */}
                        {liabilities.length > 0 ? (
                            <div className="space-y-3">
                                {liabilities.map((liability, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                                        <PartyIcon type={liability.type} />
                                        <div className="flex-1">
                                            <div className="font-medium">{liability.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <input
                                                    type="number"
                                                    className="w-24 h-8 px-2 border rounded text-sm"
                                                    value={liability.amount}
                                                    onChange={(e) => updateLiabilityAmount(index, Number(e.target.value))}
                                                    min={0}
                                                    max={estimatedCost}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    ({liability.ratio.toFixed(1)}%)
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => removeLiability(index)}
                                        >
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                请选择责任方
                            </div>
                        )}

                        {/* 分配进度 */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>已分配</span>
                                <span className={remaining === 0 ? 'text-green-600' : 'text-orange-600'}>
                                    ¥{totalAllocated.toLocaleString()} / ¥{estimatedCost.toLocaleString()}
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all ${remaining === 0 ? 'bg-green-500' : 'bg-orange-500'
                                        }`}
                                    style={{ width: `${Math.min((totalAllocated / estimatedCost) * 100, 100)}%` }}
                                />
                            </div>
                            {remaining !== 0 && (
                                <p className="text-xs text-orange-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    剩余 ¥{remaining.toLocaleString()} 待分配
                                </p>
                            )}
                        </div>

                        <Separator />

                        {/* 添加责任方按钮 */}
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" size="sm" onClick={() => addLiability('FACTORY')}>
                                <Building2 className="h-4 w-4 mr-2" />
                                供应商责任
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addLiability('INSTALLER')}>
                                <HardHat className="h-4 w-4 mr-2" />
                                安装工责任
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addLiability('SALES')}>
                                <User className="h-4 w-4 mr-2" />
                                销售责任
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addLiability('COMPANY')}>
                                <Building2 className="h-4 w-4 mr-2 text-red-500" />
                                公司承担
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 仲裁意见 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            仲裁意见
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="请输入仲裁结论和依据..."
                            value={arbitrationNotes}
                            onChange={(e) => setArbitrationNotes(e.target.value)}
                            className="min-h-[120px]"
                        />
                    </CardContent>
                </Card>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onSave?.({ liabilities, notes: arbitrationNotes })}
                    >
                        保存草稿
                    </Button>
                    <Button
                        className="flex-1"
                        disabled={remaining !== 0 || liabilities.length === 0 || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? '提交中...' : '提交仲裁'}
                        <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
