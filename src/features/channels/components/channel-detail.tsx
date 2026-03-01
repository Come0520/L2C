'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import Building2 from 'lucide-react/dist/esm/icons/building';
import User from 'lucide-react/dist/esm/icons/user';
import Phone from 'lucide-react/dist/esm/icons/phone';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Users from 'lucide-react/dist/esm/icons/users';
import PieChart from 'lucide-react/dist/esm/icons/pie-chart';
import { formatDate } from '@/shared/lib/utils';

// 渠道详情数据类型
interface ChannelDetailData {
  id: string;
  name: string;
  channelNo: string;
  level: string | null;
  status: string | null;
  contactName: string | null;
  phone: string | null;
  totalLeads: number | null;
  totalDealAmount: string | null;
  hierarchyLevel: number;
  parentId: string | null;
  categoryId: string | null;
  commissionRate: string | null;
  commissionType: string | null;
  cooperationMode: string | null;
  settlementType: string | null;
  creditLimit: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  category?: string | null;
  parent?: {
    id: string;
    name: string;
    channelNo: string;
  } | null;
  contacts?: Array<{
    id: string;
    name: string;
    phone: string;
    position: string | null;
    isMain: boolean | null;
  }>;
  children?: Array<{
    id: string;
    name: string;
    channelNo: string;
  }>;
  assignedManager?: {
    id: string;
    name: string | null;
  } | null;
}

interface ChannelDetailProps {
  channel: ChannelDetailData;
}

/**
 * 渠道详情组件
 */
export function ChannelDetail({ channel }: ChannelDetailProps) {
  // 等级颜色
  const levelColors: Record<string, string> = {
    S: 'bg-yellow-500',
    A: 'bg-green-500',
    B: 'bg-blue-500',
    C: 'bg-gray-500',
  };

  // 状态标签
  const statusLabels: Record<string, string> = {
    ACTIVE: '活跃',
    SUSPENDED: '暂停',
    TERMINATED: '终止',
  };

  // 合作模式标签
  const cooperationLabels: Record<string, string> = {
    BASE_PRICE: '底价供货',
    COMMISSION: '返佣模式',
  };

  // 结算方式标签
  const settlementLabels: Record<string, string> = {
    PREPAY: '预付结算',
    MONTHLY: '月结',
  };

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">概览</TabsTrigger>
        <TabsTrigger value="contacts">联系人</TabsTrigger>
        <TabsTrigger value="finance">财务</TabsTrigger>
        <TabsTrigger value="performance">业绩</TabsTrigger>
      </TabsList>

      {/* 概览 Tab */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 基础信息卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">渠道等级</CardTitle>
              <Building2 className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${levelColors[channel.level || 'C']}`}
                >
                  {channel.level || 'C'}
                </span>
                <span className="text-lg font-medium">
                  {channel.level === 'S'
                    ? '战略合作'
                    : channel.level === 'A'
                      ? '核心渠道'
                      : channel.level === 'B'
                        ? '重要渠道'
                        : '普通渠道'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 状态卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">状态</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  channel.status === 'ACTIVE'
                    ? 'default'
                    : channel.status === 'SUSPENDED'
                      ? 'secondary'
                      : 'destructive'
                }
                className="text-sm"
              >
                {statusLabels[channel.status || 'ACTIVE']}
              </Badge>
            </CardContent>
          </Card>

          {/* 线索数卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">累计线索</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{channel.totalLeads || 0}</div>
            </CardContent>
          </Card>

          {/* 成交额卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">累计成交</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ¥{parseFloat(channel.totalDealAmount || '0').toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 详细信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <div className="text-muted-foreground text-sm">渠道类型</div>
                <div className="font-medium">{channel.category || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">层级</div>
                <div className="font-medium">第 {channel.hierarchyLevel} 级</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">父级渠道</div>
                <div className="font-medium">{channel.parent?.name || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">负责人</div>
                <div className="font-medium">{channel.assignedManager?.name || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">创建时间</div>
                <div className="font-medium">
                  {channel.createdAt ? formatDate(channel.createdAt) : '-'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">更新时间</div>
                <div className="font-medium">
                  {channel.updatedAt ? formatDate(channel.updatedAt) : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 子渠道 */}
        {channel.children && channel.children.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>子渠道 ({channel.children.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {channel.children.map((child) => (
                  <Badge key={child.id} variant="outline">
                    {child.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* 联系人 Tab */}
      <TabsContent value="contacts">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              联系人列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            {channel.contacts && channel.contacts.length > 0 ? (
              <div className="space-y-4">
                {channel.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                        <User className="text-primary h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          {contact.name}
                          {contact.isMain && (
                            <Badge variant="secondary" className="text-xs">
                              主联系人
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          {contact.position || '未填写职位'}
                        </div>
                      </div>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">暂无联系人</div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* 财务 Tab */}
      <TabsContent value="finance">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              财务配置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <div>
                <div className="text-muted-foreground text-sm">合作模式</div>
                <div className="text-lg font-medium">
                  {cooperationLabels[channel.cooperationMode || 'COMMISSION']}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">结算方式</div>
                <div className="text-lg font-medium">
                  {settlementLabels[channel.settlementType || 'PREPAY']}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">返点比例</div>
                <div className="text-lg font-medium">
                  {channel.commissionRate ? `${channel.commissionRate}%` : '-'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm">返点类型</div>
                <div className="text-lg font-medium">
                  {channel.commissionType === 'TIERED' ? '阶梯返点' : '固定比例'}
                </div>
              </div>
              {channel.settlementType === 'MONTHLY' && (
                <div>
                  <div className="text-muted-foreground text-sm">授信额度</div>
                  <div className="text-lg font-medium">
                    ¥{parseFloat(channel.creditLimit || '0').toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 业绩 Tab */}
      <TabsContent value="performance">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              业绩统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground py-12 text-center">业绩统计功能开发中...</div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
