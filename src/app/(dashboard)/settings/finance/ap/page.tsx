import { auth } from '@/shared/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default async function APSettingsPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">付款配置</h1>
                <p className="text-muted-foreground">
                    管理供应商付款规则及劳务结算标准
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>付款策略</CardTitle>
                        <CardDescription>
                            配置各品类的默认付款周期和结算模式
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            付款策略配置功能正在开发中...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
