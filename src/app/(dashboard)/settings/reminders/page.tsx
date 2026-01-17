import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';

export default function RemindersPage() {
    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="提醒设置"
                subtitle="配置系统通知和提醒规则"
            />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>基础提醒</CardTitle>
                        <CardDescription>配置系统内置的基础业务提醒</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="quote-reminder">报价跟进提醒</Label>
                                <div className="text-sm text-muted-foreground">
                                    当报价单超过3天未跟进时提醒销售
                                </div>
                            </div>
                            <Switch id="quote-reminder" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="payment-reminder">回款逾期提醒</Label>
                                <div className="text-sm text-muted-foreground">
                                    当应收到期前1天和逾期后提醒财务
                                </div>
                            </div>
                            <Switch id="payment-reminder" defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
