'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Wallet, Users, Truck, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateAPPaymentConfig, type APPaymentConfig } from '@/features/settings/actions/tenant-config';

interface APConfigFormProps {
    initialConfig: APPaymentConfig;
}

/**
 * 付款策略配置表单组件
 */
export function APConfigForm({ initialConfig }: APConfigFormProps) {
    const [isPending, startTransition] = useTransition();

    // 预存模式配置
    const [prepaidBonusType, setPrepaidBonusType] = useState(initialConfig.prepaidBonusType);
    const [prepaidBonusRatio, setPrepaidBonusRatio] = useState(initialConfig.prepaidBonusRatio * 100);

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateAPPaymentConfig({
                prepaidBonusType,
                prepaidBonusRatio: prepaidBonusRatio / 100,
            });

            if (result.success) {
                toast.success('付款策略配置已保存');
            } else {
                toast.error(result.error || '保存失败');
            }
        });
    };

    return (
        <>
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">策略概览</TabsTrigger>
                    <TabsTrigger value="prepaid">预存模式</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    {/* 采购付款 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                采购付款
                            </CardTitle>
                            <CardDescription>
                                向面料/配件供应商的付款方式
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="border rounded-lg p-4 text-center">
                                    <div className="font-medium">现付</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        货到即付款（默认）
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4 text-center">
                                    <div className="font-medium">月结</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        按月汇总付款
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4 text-center bg-primary/5 border-primary">
                                    <div className="font-medium text-primary">预存</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        先充值后扣款
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                💡 结算方式在供应商资料中单独配置，新增供应商默认为"现付"
                            </p>
                        </CardContent>
                    </Card>

                    {/* 劳务结算 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                劳务结算
                            </CardTitle>
                            <CardDescription>
                                测量师/安装师傅的工费结算方式
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4 text-center">
                                    <div className="font-medium">按单即时结</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        完成任务后立即结算
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4 text-center">
                                    <div className="font-medium">月结</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        按月汇总工单结算
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                💡 结算方式在劳务人员资料中单独配置，新增人员默认为"按单即时结"
                            </p>
                        </CardContent>
                    </Card>

                    {/* 物流费用 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                物流费用
                            </CardTitle>
                            <CardDescription>
                                配送物流商的费用结算方式
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4 text-center">
                                    <div className="font-medium">按单即时结</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        每次配送后即时结算
                                    </div>
                                </div>
                                <div className="border rounded-lg p-4 text-center">
                                    <div className="font-medium">月结</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        按月汇总配送费结算
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-4">
                                💡 结算方式在物流商资料中单独配置
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prepaid" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Gift className="h-5 w-5" />
                                预存赠送规则
                            </CardTitle>
                            <CardDescription>
                                配置供应商预存充值时的赠送方式
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>赠送方式</Label>
                                <Select value={prepaidBonusType} onValueChange={(v) => setPrepaidBonusType(v as typeof prepaidBonusType)}>
                                    <SelectTrigger className="w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="BALANCE">赠送货款</SelectItem>
                                        <SelectItem value="GOODS">赠送商品</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    赠送货款：充值后账户余额增加赠送比例，如存1万得1.1万
                                </p>
                            </div>

                            {prepaidBonusType === 'BALANCE' && (
                                <div className="space-y-2">
                                    <Label>默认赠送比例</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={prepaidBonusRatio}
                                            onChange={(e) => setPrepaidBonusRatio(Number(e.target.value))}
                                            className="w-24"
                                            min={0}
                                            max={100}
                                        />
                                        <span className="text-muted-foreground">%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        如设置 10，则充值 ¥10000，账户增加 ¥{(10000 * (1 + prepaidBonusRatio / 100)).toFixed(0)}
                                    </p>
                                </div>
                            )}

                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-2">预存流程</h4>
                                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>在供应商资料中设置结算方式为"预存"</li>
                                    <li>通过财务模块进行预存充值</li>
                                    <li>采购付款时自动从预存余额扣除</li>
                                    <li>余额不足时提醒充值</li>
                                </ol>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    保存配置
                </Button>
            </div>
        </>
    );
}
