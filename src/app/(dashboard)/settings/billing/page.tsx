export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getTenantSubscription } from '@/features/billing/actions/subscription-actions';
import { auth } from '@/shared/lib/auth';
import { UsageDashboard } from '@/features/billing/components/usage-dashboard';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '订阅与用量 | L2C',
  description: '管理您的企业订阅套餐与查看系统用量',
};

export default async function BillingSettingsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  if (!tenantId) return <div>Auth required</div>;

  const subscription = await getTenantSubscription(tenantId);
  if (!subscription) return <div>加载订阅信息失败</div>;

  const { planType, planExpiresAt, isGrandfathered, isExpired } = subscription;

  const planNameMap: Record<string, string> = {
    base: '基础版 (Base)',
    pro: '专业版 (Pro)',
    enterprise: '企业版 (Enterprise)',
  };

  return (
    <div className="flex-1 space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">订阅与用量</h2>
      </div>

      <div className="grid gap-4 md:grid-flow-col">
        {/* 当前订阅卡片 */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">当前订阅</CardTitle>
              {isGrandfathered ? (
                <Badge variant="default" className="bg-amber-500">
                  内测免限额
                </Badge>
              ) : planType === 'base' ? (
                <Badge variant="secondary">基础版</Badge>
              ) : isExpired ? (
                <Badge variant="destructive">已过期</Badge>
              ) : (
                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                  生效中
                </Badge>
              )}
            </div>
            <CardDescription>管理您的账单及套餐权益</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm font-medium">当前套餐</p>
                <h3 className="mt-1 text-2xl font-bold">{planNameMap[planType] || planType}</h3>
              </div>

              {!isGrandfathered && planType !== 'base' && (
                <div>
                  <p className="text-muted-foreground text-sm font-medium">有效期至</p>
                  <p className="mt-1 text-base font-medium">
                    {planExpiresAt
                      ? planExpiresAt.toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '永久'}
                  </p>
                </div>
              )}

              {isExpired && !isGrandfathered && (
                <div className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-md p-3 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  您的专业版订阅已过期，系统已自动降级为基础版规则。
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {(planType === 'base' || isExpired) && !isGrandfathered ? (
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  {/* 此处假定升级入口跳转专门的计费 checkout 页面或呼出弹窗 */}
                  <Link href="#pricing">立即升级</Link>
                </Button>
              ) : null}
              {planType === 'pro' && !isExpired && (
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  管理续费
                </Button>
              )}
              <Button size="lg" variant="ghost" className="w-full sm:w-auto">
                账单记录
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 用量统计仪表盘 */}
        <div className="md:col-span-2">
          <UsageDashboard />
        </div>
      </div>

      {/* 套餐对比区域 */}
      <div className="mt-8" id="pricing">
        <h3 className="mb-4 text-xl font-bold">套餐对比</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <PricingCard
            title="基础版"
            price="免费"
            desc="适合初创团队与小微商家"
            features={[
              '5个协作账号',
              '50次报价单/月',
              '200个客户档案管理',
              '200个云展厅名额',
              '基础财务模块',
            ]}
          />
          <PricingCard
            title="专业版"
            price="¥9.9/月"
            desc="中小企业标准数字化方案"
            isPopular
            buttonText="立即升级"
            features={[
              '15个协作账号 (可购加油包)',
              '无限报价/订单量',
              '5000个客户档案管理',
              '500个云展厅名额',
              '多级审批流程',
              '数据导出',
              '自有 Logo / 去除水印',
              '小程序专属登录页',
            ]}
          />
          <PricingCard
            title="企业版"
            price="定制"
            desc="大中型企业私有化/微定制"
            features={[
              '不限制账号数量',
              '无限制容量与数量',
              '专属技术客服支持',
              'API系统对接开发支持',
              '支持本地化私有化部署',
              '独立数据存储',
              '专属云展厅定制',
              '专属功能定制',
            ]}
            buttonText="联系商务"
            buttonVariant="outline"
          />
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  title,
  price,
  desc,
  features,
  isPopular = false,
  buttonText = '当前套餐',
  buttonVariant = 'default',
}: {
  title: string;
  price: string;
  desc: string;
  features: string[];
  isPopular?: boolean;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary';
}) {
  return (
    <Card
      className={`relative flex flex-col ${isPopular ? 'border-primary scale-105 shadow-md' : ''}`}
    >
      {isPopular && (
        <div className="bg-primary text-primary-foreground absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-bold">
          推荐使用
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="h-10">{desc}</CardDescription>
        <div className="mt-4 text-3xl font-bold">{price}</div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <ul className="mb-8 flex-1 space-y-3">
          {features.map((f, i) => (
            <li key={i} className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              <span className="text-foreground/80 text-sm">{f}</span>
            </li>
          ))}
        </ul>
        <Button variant={buttonVariant} className="mt-auto w-full">
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}

