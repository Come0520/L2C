'use client';

import { useState } from 'react';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Settings2, Users, Wrench, Calculator, Factory, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 业务流程模式配置页面
 * 根据租户规模配置不同的业务流程模式
 */
export default function WorkflowSettingsPage() {
    // 业务模式开关
    const [enableLeadAssignment, setEnableLeadAssignment] = useState(true);
    const [measureDispatchMode, setMeasureDispatchMode] = useState('DISPATCHER');
    const [installDispatchMode, setInstallDispatchMode] = useState('DISPATCHER');
    const [enableLaborFeeCalc, setEnableLaborFeeCalc] = useState(true);
    const [enableOutsourceProcessing, setEnableOutsourceProcessing] = useState(true);
    const [enablePurchaseApproval, setEnablePurchaseApproval] = useState(true);

    const handleSave = async () => {
        // TODO: 调用 Server Action 保存配置
        toast.success('业务流程模式配置已保存');
    };

    // 判断是否为小店模式
    const isSmallShopMode = !enableLeadAssignment &&
        measureDispatchMode === 'SELF' &&
        installDispatchMode === 'SELF' &&
        !enableLaborFeeCalc &&
        !enableOutsourceProcessing &&
        !enablePurchaseApproval;

    const applySmallShopMode = () => {
        setEnableLeadAssignment(false);
        setMeasureDispatchMode('SELF');
        setInstallDispatchMode('SELF');
        setEnableLaborFeeCalc(false);
        setEnableOutsourceProcessing(false);
        setEnablePurchaseApproval(false);
        toast.info('已切换为小店模式');
    };

    const applyLargeShopMode = () => {
        setEnableLeadAssignment(true);
        setMeasureDispatchMode('DISPATCHER');
        setInstallDispatchMode('DISPATCHER');
        setEnableLaborFeeCalc(true);
        setEnableOutsourceProcessing(true);
        setEnablePurchaseApproval(true);
        toast.info('已切换为大店模式');
    };

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="业务流程模式"
                subtitle="根据团队规模配置业务流程"
            >
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={applySmallShopMode}>
                        一键小店模式
                    </Button>
                    <Button variant="outline" size="sm" onClick={applyLargeShopMode}>
                        一键大店模式
                    </Button>
                </div>
            </DashboardPageHeader>

            {/* 模式提示 */}
            <div className={`rounded-lg p-4 ${isSmallShopMode ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'}`}>
                <div className="flex items-center gap-2">
                    <Settings2 className={`h-5 w-5 ${isSmallShopMode ? 'text-green-600' : 'text-blue-600'}`} />
                    <span className={`font-medium ${isSmallShopMode ? 'text-green-800 dark:text-green-200' : 'text-blue-800 dark:text-blue-200'}`}>
                        当前模式：{isSmallShopMode ? '小店模式（老板一人运营）' : '大店模式（团队分工）'}
                    </span>
                </div>
            </div>

            {/* 线索管理 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        线索管理
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-lead-assignment">启用线索分配</Label>
                            <div className="text-sm text-muted-foreground">
                                禁用后所有线索自动归属当前用户，无公海池和认领功能
                            </div>
                        </div>
                        <Switch
                            id="enable-lead-assignment"
                            checked={enableLeadAssignment}
                            onCheckedChange={setEnableLeadAssignment}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 派单模式 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5" />
                        派单模式
                    </CardTitle>
                    <CardDescription>
                        选择"自己做"则跳过派单环节，任务直接由当前用户完成
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>测量派单模式</Label>
                            <Select value={measureDispatchMode} onValueChange={setMeasureDispatchMode}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SELF">自己做（无派单）</SelectItem>
                                    <SelectItem value="DISPATCHER">派单员派单</SelectItem>
                                    <SelectItem value="SALES">销售直接派单</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>安装派单模式</Label>
                            <Select value={installDispatchMode} onValueChange={setInstallDispatchMode}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SELF">自己做（无派单）</SelectItem>
                                    <SelectItem value="DISPATCHER">派单员派单</SelectItem>
                                    <SelectItem value="SALES">销售直接派单</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 费用计算 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        费用计算
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-labor-fee">启用劳务费用计算</Label>
                            <div className="text-sm text-muted-foreground">
                                禁用后完成工单不计算测量/安装工费
                            </div>
                        </div>
                        <Switch
                            id="enable-labor-fee"
                            checked={enableLaborFeeCalc}
                            onCheckedChange={setEnableLaborFeeCalc}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-outsource" className="flex items-center gap-2">
                                <Factory className="h-4 w-4" />
                                启用外发加工
                            </Label>
                            <div className="text-sm text-muted-foreground">
                                禁用后不计算加工费（适用于自己加工的情况）
                            </div>
                        </div>
                        <Switch
                            id="enable-outsource"
                            checked={enableOutsourceProcessing}
                            onCheckedChange={setEnableOutsourceProcessing}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 采购审批 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5" />
                        采购审批
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enable-purchase-approval">启用采购审批</Label>
                            <div className="text-sm text-muted-foreground">
                                禁用后采购单创建后直接进入待付款状态，无需审批
                            </div>
                        </div>
                        <Switch
                            id="enable-purchase-approval"
                            checked={enablePurchaseApproval}
                            onCheckedChange={setEnablePurchaseApproval}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>保存配置</Button>
            </div>
        </div>
    );
}
