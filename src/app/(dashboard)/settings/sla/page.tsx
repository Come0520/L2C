import { auth } from '@/shared/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default async function SLASettingsPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">SLA 配置</h1>
                <p className="text-muted-foreground">
                    为关键业务环节设定标准时长和时效考核规则
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>业务环节时效</CardTitle>
                        <CardDescription>
                            配置各模块关键操作的标准完成时间（SLA�?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            SLA 时效配置功能正在开发中...
                        </p>
                        {/* 例如：线索跟�?24h, 测量上门 48h �?*/}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
