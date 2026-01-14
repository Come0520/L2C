import { auth } from '@/shared/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default async function ThemeSettingsPage() {
    const session = await auth();
    if (!session?.user) return null;

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">主题设置</h1>
                <p className="text-muted-foreground">
                    自定义系统的视觉风格和色彩方�?
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>色彩方案</CardTitle>
                        <CardDescription>
                            选择系统的主题颜色和亮度模式
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            主题颜色选择功能正在开发中...
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>界面风格</CardTitle>
                        <CardDescription>
                            切换不同�?UI 拟态风格（�?Liquid Glass�?
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            界面风格切换功能正在开发中...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
