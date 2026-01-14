import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { UserPreferenceSettings } from '@/features/settings/components/user-preference-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';

export default async function PreferencesPage() {
    const session = await auth();
    if (!session?.user) return null;

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    const prefs = (user?.preferences as Record<string, unknown>) || {};
    const quoteMode = (prefs.quoteMode === 'CATEGORY_FIRST' || prefs.quoteMode === 'SPACE_FIRST')
        ? prefs.quoteMode
        : 'CATEGORY_FIRST';

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">界面偏好</h1>
                <p className="text-muted-foreground">
                    个性化您的工作界面和操作习�?
                </p>
            </div>

            <Tabs defaultValue="quote" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="quote" className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        报价偏好
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        列表偏好
                    </TabsTrigger>
                </TabsList>

                {/* 报价偏好 */}
                <TabsContent value="quote" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>报价模式</CardTitle>
                            <CardDescription>
                                设置创建报价单时的默认组织方�?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserPreferenceSettings initialQuoteMode={quoteMode} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 列表偏好 */}
                <TabsContent value="list" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>列表显示</CardTitle>
                            <CardDescription>
                                设置各模块列表页的默认显示列和排序方�?
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                列表显示偏好配置正在开发中...
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
