import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductById } from '@/features/products/actions/queries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Edit, Package, DollarSign, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

// Remove dynamic export if not needed, or keep it if intentional.
// For now, let's fix the import.

type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductById>>['data']>;
type Log = ProductDetail['logs'][number];

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const result = await getProductById({ id });

    if (result.error || !result.data) {
        notFound();
    }

    const productData = result.data;
    const attributes = ((productData.specs || {}) as Record<string, unknown>);
    const hasAttributes = Object.keys(attributes).length > 0;

    const categoryMap: Record<string, string> = {
        CURTAIN_FABRIC: '窗帘面料',
        CURTAIN_SHEER: '窗纱',
        CURTAIN_TRACK: '轨道',
        CURTAIN_ACCESSORY: '配件',
        WALLCLOTH: '墙布',
        WALLPANEL: '墙板',
        WINDOWPAD: '窗垫',
        STANDARD: '标准品',
        MOTOR: '电机',
    };

    const actionMap: Record<string, string> = {
        CREATE: '创建',
        UPDATE: '更新',
        DELETE: '删除',
        ACTIVATE: '激活',
        DEACTIVATE: '停用',
    };

    return (
        <div className="space-y-6 min-h-screen bg-transparent p-1">
            <div className="fixed inset-0 liquid-mesh-bg -z-20" />
            <div className="fixed inset-0 aurora-animate -z-10" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/supply-chain/products">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            返回列表
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{productData.name}</h1>
                        <p className="text-sm text-gray-500 mt-1">SKU: {productData.sku}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Badge variant={productData.isActive ? 'success' : 'secondary'}>
                        {productData.isActive ? '已激活' : '已停用'}
                    </Badge>
                    <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑商品
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                <CardTitle>基本信息</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">商品名称</label>
                                    <p className="mt-1 text-gray-900">{productData.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">SKU</label>
                                    <p className="mt-1 text-gray-900">{productData.sku}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">商品分类</label>
                                    <p className="mt-1">
                                        <Badge variant="primary">
                                            {categoryMap[productData.category || ''] || productData.category || '未分类'}
                                        </Badge>
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">计量单位</label>
                                    <p className="mt-1 text-gray-900">{productData.unit}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">默认供应商</label>
                                    <p className="mt-1 text-gray-900">
                                        {/* @ts-ignore */}
                                        {productData.defaultSupplier?.name || '未设置'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">是否可库存</label>
                                    <p className="mt-1">
                                        <Badge variant={productData.isStockable ? 'success' : 'secondary'}>
                                            {productData.isStockable ? '是' : '否'}
                                        </Badge>
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                <CardTitle>价格信息</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">基准单价</label>
                                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                                        ¥{productData.unitPrice}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">成本价</label>
                                    <p className="mt-1 text-gray-900">
                                        ¥{productData.purchasePrice ? productData.purchasePrice : '未设置'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                <CardTitle>库存信息</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">当前库存</label>
                                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                                        -- {productData.unit || '件'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">安全库存</label>
                                    <p className="mt-1 text-gray-900">
                                        未设置
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                <CardTitle>商品属性</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!hasAttributes ? (
                                <p className="text-gray-500">暂无属性信息</p>
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(attributes).map(([key, value]) => (
                                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-sm text-gray-500">{key}</span>
                                            <span className="text-sm text-gray-900">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>操作日志</CardTitle>
                            <CardDescription>最近 20 条操作记录</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {(!productData.logs || productData.logs.length === 0) ? (
                                <p className="text-gray-500">暂无操作日志</p>
                            ) : (
                                <div className="space-y-3">
                                    {productData.logs.map((log: Log) => (
                                        <div
                                            key={log.id}
                                            className="p-3 bg-gray-50 rounded-lg space-y-1"
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {actionMap[log.action] || log.action}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {log.createdAt ? new Date(log.createdAt).toLocaleString('zh-CN') : '-'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                操作人 ID: {log.userId}
                                            </div>
                                            {Object.keys((log.changedFields as Record<string, unknown>) || {}).length > 0 && (
                                                <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                                                    <pre className="text-xs text-gray-600 overflow-x-auto">
                                                        {JSON.stringify(log.changedFields, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Images disabled due to missing schema definition */}
                    {false && Array.isArray((productData as any).images) && (productData as any).images.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>商品图片</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    {((productData as any).images as string[]).map((image, index) => (
                                        <Image
                                            key={index}
                                            src={image}
                                            alt={`${productData.name} ${index + 1}`}
                                            width={200}
                                            height={128}
                                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
