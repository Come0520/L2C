'use client';

import React, { useEffect } from 'react';
import { ExcelExportButton } from '@/shared/components/data-export';
import dynamic from 'next/dynamic';
import { registerFonts } from '@/shared/components/data-export';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { FileText } from 'lucide-react';
import { ExportColumn } from '@/shared/lib/export-utils';

// 动态导入 PDF 组件并禁用服务端渲染
const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
    { ssr: false }
);

const PDFViewer = dynamic(
    () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
    { ssr: false }
);

const GenericOrderPdf = dynamic(
    () => import('@/shared/components/data-export').then((mod) => mod.GenericOrderPdf),
    { ssr: false }
);

/**
 * 导出功能测试页面
 */
export default function ExportTestPage() {
    // 页面加载时注册字体
    useEffect(() => {
        registerFonts();
    }, []);

    const mockData = [
        { id: 'ORD001', customer: '张三', amount: '￥1,200.00', status: '已完成', date: '2024-01-15' },
        { id: 'ORD002', customer: '李四', amount: '￥3,500.00', status: '处理中', date: '2024-01-16' },
        { id: 'ORD003', customer: '王五', amount: '￥800.00', status: '待付款', date: '2024-01-17' },
    ];

    type DataRow = (typeof mockData)[0];

    const columns: ExportColumn<DataRow>[] = [
        { header: '订单号', accessorKey: 'id' },
        { header: '客户名称', accessorKey: 'customer' },
        { header: '金额', accessorKey: 'amount' },
        { header: '状态', accessorKey: 'status' },
        { header: '日期', accessorKey: 'date' },
    ];

    const pdfOrderInfo = [
        { label: '单据编号', value: 'ORD-20240115001' },
        { label: '创建日期', value: '2024-01-15' },
        { label: '制单人', value: '系统管理员' },
        { label: '客户名称', value: '示例客户有限公司' },
        { label: '联系电话', value: '138-0000-0000' },
        { label: '送货地址', value: '上海市浦东新区某某路 888 号' },
    ];

    const pdfFooterInfo = [
        { label: '合计金额', value: '￥5,500.00' },
        { label: '备注说明', value: '此单据为系统自动生成，如有疑问请联系财务。' },
    ];

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold">导出功能测试</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Excel 导出测试 */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        Excel 导出
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        测试通用 Excel 导出按钮，支持自动表头映射和 Loading 状态。
                    </p>
                    { }
                    <ExcelExportButton
                        data={mockData}
                        columns={columns as any}
                        filename="订单列表导出"
                    />
                </Card>

                {/* PDF 导出测试 */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        PDF 导出
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        测试通用 PDF 单据模版，集成中文字体支持和专业排版。
                    </p>
                    <div className="flex gap-2">
                        <PDFDownloadLink
                            document={
                                <GenericOrderPdf
                                    title="销售发货单"
                                    orderInfo={pdfOrderInfo}
                                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                                    columns={columns as any}
                                    data={mockData}
                                    footerInfo={pdfFooterInfo}
                                />
                            }
                            fileName="发货单.pdf"
                        >
                            {({ loading }: { loading: boolean }) => (
                                <Button variant="outline" size="sm" disabled={loading}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    {loading ? '正在生成...' : '下载 PDF'}
                                </Button>
                            )}
                        </PDFDownloadLink>
                    </div>
                </Card>
            </div>

            {/* PDF 实时预览 */}
            <Card className="p-6 space-y-4">
                <h2 className="text-lg font-semibold">PDF 实时预览 (仅开发模式可见)</h2>
                <div className="h-[600px] border rounded-md overflow-hidden bg-muted">
                    <PDFViewer width="100%" height="100%" showToolbar={false} style={{ border: 'none' }}>
                        <GenericOrderPdf
                            title="销售发货单 (预览)"
                            orderInfo={pdfOrderInfo}
                            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                            columns={columns as any}
                            data={mockData}
                            footerInfo={pdfFooterInfo}
                        />
                    </PDFViewer>
                </div>
            </Card>
        </div>
    );
}
