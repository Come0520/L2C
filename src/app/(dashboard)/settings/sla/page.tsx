import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * SLA 设置页面
 * 管理服务级别协议规则
 */
export default function SLASettingsPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="SLA 设置"
                subtitle="管理服务级别协议规则"
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            响应时效
                        </CardTitle>
                        <CardDescription>
                            配置各业务环节的标准响应时间
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>线索首次响应</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" defaultValue="2" className="w-20" />
                                    <span className="text-sm text-muted-foreground">小时内</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>测量任务确认</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" defaultValue="24" className="w-20" />
                                    <span className="text-sm text-muted-foreground">小时内</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>报价单生成</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" defaultValue="48" className="w-20" />
                                    <span className="text-sm text-muted-foreground">小时内</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>售后工单响应</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" defaultValue="4" className="w-20" />
                                    <span className="text-sm text-muted-foreground">小时内</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            预警规则
                        </CardTitle>
                        <CardDescription>
                            配置SLA即将超时的预警时机
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>预警时间</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">距离超时前</span>
                                <Input type="number" defaultValue="30" className="w-20" />
                                <span className="text-sm text-muted-foreground">分钟发送预警</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button>保存设置</Button>
                </div>
            </div>
        </div>
    );
}
