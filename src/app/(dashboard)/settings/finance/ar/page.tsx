import { auth } from '@/shared/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default async function FinanceARConfigPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">收款配置</h1>
                <p className="text-muted-foreground">
                    管理收款计划模板、定金比例及逾期规则
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>收款计划模板</CardTitle>
                        <CardDescription>
                            配置不同业务场景下的默认分期收款方案
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            收款模板配置功能正在开发中...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
