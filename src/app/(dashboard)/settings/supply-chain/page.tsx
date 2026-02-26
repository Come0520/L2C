import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Package, Users } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

/**
 * 供应链配置页面
 * 管理供应商和仓库设置
 */
export default function SupplyChainSettingsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader title="供应链配置" subtitle="管理供应商和仓库设置">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          添加供应商
        </Button>
      </DashboardPageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              供应商管理
            </CardTitle>
            <CardDescription>管理合作供应商信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground py-8 text-center">暂无供应商数据</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              仓库设置
            </CardTitle>
            <CardDescription>配置仓库和库存管理</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground py-8 text-center">暂无仓库数据</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
