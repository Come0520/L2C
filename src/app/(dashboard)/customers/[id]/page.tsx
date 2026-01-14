/**
 * 客户详情页
 */

import { notFound, redirect } from 'next/navigation';
import { getCustomerDetail } from '@/features/customers/actions';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { formatDate } from '@/shared/lib/utils';
import { Edit, Phone, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import Link from 'next/link';

import { EditCustomerDialog } from '@/features/customers/components/edit-customer-dialog';
import { CustomerAddressList } from '@/features/customers/components/customer-address-list';
import { auth } from '@/shared/lib/auth';

export const revalidate = 60;

export default async function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const session = await auth();
    const userId = session?.user?.id;
    const tenantId = session?.user?.tenantId;

    if (!userId || !tenantId) {
        redirect('/auth/login');
    }

    const resolvedParams = await params;
    const customer = await getCustomerDetail(resolvedParams.id);

    if (!customer) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <nav className="text-sm text-gray-500">
                    <Link href="/customers" className="hover:text-gray-700 transition-colors">客户管理</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-700">客户详情</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {customer.name}
                            <Badge variant={
                                customer.level === 'A' ? 'default' :
                                    customer.level === 'B' ? 'secondary' : 'outline'
                            } className={
                                customer.level === 'A' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                            }>
                                {customer.level}级
                            </Badge>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">客户编号: {customer.customerNo}</p>
                    </div>
                    <div className="flex gap-2">
                        <EditCustomerDialog
                            customer={customer}
                            userId={userId}
                            trigger={
                                <Button variant="outline">
                                    <Edit className="h-4 w-4 mr-2" />
                                    编辑资料
                                </Button>
                            }
                        />
                        <Button>
                            <Link href={`/leads/new?customerId=${customer.id}`} className="flex items-center">
                                新建线索
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader title="基础信息" className="border-b pb-4 mb-4" />
                        <CardContent>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Phone className="h-4 w-4" /> 手机号
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">{customer.phone}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4" /> 微信号
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900">{customer.wechat || '-'}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">备注</dt>
                                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                                        {customer.notes || '暂无备注'}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <div className="text-2xl font-bold">¥{Number(customer.totalAmount || 0).toLocaleString()}</div>
                                <div className="text-sm text-gray-500 mt-1">累计交易额</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <div className="text-2xl font-bold">{customer.totalOrders}</div>
                                <div className="text-sm text-gray-500 mt-1">累计订单数</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <div className="text-2xl font-bold">
                                    {customer.lastOrderAt ? Math.floor((Date.now() - new Date(customer.lastOrderAt).getTime()) / (1000 * 60 * 60 * 24)) : '-'}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">距上单天数</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Tabs defaultValue="addresses">
                        <TabsList>
                            <TabsTrigger value="addresses">地址管理</TabsTrigger>
                            <TabsTrigger value="orders">订单记录</TabsTrigger>
                            <TabsTrigger value="referrals">转介绍 ({customer.referrals?.length || 0})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="addresses" className="mt-4">
                            <CustomerAddressList
                                addresses={customer.addresses || []}
                                customerId={customer.id}
                                tenantId={tenantId}
                            />
                        </TabsContent>
                        <TabsContent value="orders" className="mt-4">
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                订单记录开发中...
                            </div>
                        </TabsContent>
                        <TabsContent value="referrals" className="mt-4">
                            <div className="space-y-2">
                                {customer.referrals?.length > 0 ? (
                                    customer.referrals.map((ref: any) => (
                                        <div key={ref.id} className="flex justify-between items-center p-3 border rounded bg-white">
                                            <div className="flex flex-col">
                                                <Link href={`/customers/${ref.id}`} className="font-medium text-blue-600 hover:underline">
                                                    {ref.name}
                                                </Link>
                                                <span className="text-xs text-gray-500">{ref.customerNo}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {formatDate(ref.createdAt)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">暂无转介绍记录</div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right: Side Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader title="系统信息" className="text-sm text-gray-500 uppercase tracking-wider" />
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">创建时间</span>
                                <span className="text-gray-900">{customer.createdAt ? formatDate(customer.createdAt) : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">创建人</span>
                                <span className="text-gray-900">{customer.creator?.name || '系统'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">归属销售</span>
                                <span className="text-gray-900">{customer.assignedSales?.name || '未分配'}</span>
                            </div>
                            {customer.referrer && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">推荐人</span>
                                    <Link href={`/customers/${customer.referrer.id}`} className="text-blue-600 hover:underline">
                                        {customer.referrer.name}
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
