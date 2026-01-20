'use client';

import { useState } from 'react';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { CreditCard, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 收款规则配置页面
 * 配置分期付款规则和安装前收款检查
 */
export default function ARConfigPage() {
    // 分期付款规则
    const [enableInstallment, setEnableInstallment] = useState(true);
    const [minDepositRatio, setMinDepositRatio] = useState(30);
    const [minDepositAmount, setMinDepositAmount] = useState(500);
    const [depositCalcRule, setDepositCalcRule] = useState('HIGHER');

    // 安装前收款检查
    const [allowDebtInstall, setAllowDebtInstall] = useState(false);
    const [requireDebtApproval, setRequireDebtApproval] = useState(true);

    const handleSave = async () => {
        // TODO: 调用 Server Action 保存配置
        toast.success('收款规则配置已保存');
    };

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="收款规则配置"
                subtitle="配置分期付款规则和安装前收款检查"
            />

            {/* 分期付款规则 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        分期付款规则
                    </CardTitle>
                    <CardDescription>
                        配置订单的定金收取规则
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-installment">允许分期付款</Label>
                            <div className="text-sm text-muted-foreground">
                                开启后客户可分期付款，关闭则必须全款
                            </div>
                        </div>
                        <Switch
                            id="enable-installment"
                            checked={enableInstallment}
                            onCheckedChange={setEnableInstallment}
                        />
                    </div>

                    {enableInstallment && (
                        <>
                            <Separator />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>定金最低比例</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            value={minDepositRatio}
                                            onChange={(e) => setMinDepositRatio(Number(e.target.value))}
                                            className="w-24"
                                            min={0}
                                            max={100}
                                        />
                                        <span className="text-muted-foreground">%</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        如设置 30，则定金至少为订单金额的 30%
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label>定金最低金额</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">¥</span>
                                        <Input
                                            type="number"
                                            value={minDepositAmount}
                                            onChange={(e) => setMinDepositAmount(Number(e.target.value))}
                                            className="w-32"
                                            min={0}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        无论订单金额多少，定金不低于此金额
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>定金计算规则</Label>
                                <Select value={depositCalcRule} onValueChange={setDepositCalcRule}>
                                    <SelectTrigger className="w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="HIGHER">取两者孰高</SelectItem>
                                        <SelectItem value="LOWER">取两者孰低</SelectItem>
                                        <SelectItem value="RATIO_ONLY">仅按比例</SelectItem>
                                        <SelectItem value="AMOUNT_ONLY">仅按金额</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    当选择"取两者孰高"时，定金 = MAX(订单金额 × {minDepositRatio}%, ¥{minDepositAmount})
                                </p>
                            </div>

                            <div className="bg-muted/50 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-2">计算示例</h4>
                                <p className="text-sm text-muted-foreground">
                                    订单金额 ¥2000，定金 = MAX(2000 × {minDepositRatio}%, {minDepositAmount})
                                    = MAX(¥{(2000 * minDepositRatio / 100).toFixed(0)}, ¥{minDepositAmount})
                                    = ¥{Math.max(2000 * minDepositRatio / 100, minDepositAmount).toFixed(0)}
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* 安装前收款检查 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        安装前收款检查
                    </CardTitle>
                    <CardDescription>
                        配置安装单生成时的收款校验规则
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="allow-debt-install">允许欠款安装（现结客户）</Label>
                            <div className="text-sm text-muted-foreground">
                                关闭时，现结渠道客户必须全款结清才能安排安装
                            </div>
                        </div>
                        <Switch
                            id="allow-debt-install"
                            checked={allowDebtInstall}
                            onCheckedChange={setAllowDebtInstall}
                        />
                    </div>

                    {allowDebtInstall && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="require-debt-approval">欠款安装需审批</Label>
                                    <div className="text-sm text-muted-foreground">
                                        开启后，未结清款项的安装需要走审批流程
                                    </div>
                                </div>
                                <Switch
                                    id="require-debt-approval"
                                    checked={requireDebtApproval}
                                    onCheckedChange={setRequireDebtApproval}
                                />
                            </div>
                        </>
                    )}

                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <div className="flex gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200">安装检查逻辑</h4>
                                <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 space-y-1 list-disc list-inside">
                                    <li><strong>月结渠道</strong>：检查渠道已欠款 + 本单金额 ≤ 授信额度</li>
                                    <li><strong>现结渠道</strong>：根据上述配置检查是否需要全款结清</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>保存配置</Button>
            </div>
        </div>
    );
}
