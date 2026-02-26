// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ReportNavigation } from '@/features/finance/components/report-navigation';
import { CashFlowData } from '@/features/finance';
import { ReportPdfTemplate } from '@/features/finance/components/report-pdf-template';
import { ExcelExportButton } from '@/shared/components/data-export/excel-export-button';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { FileDown, Printer, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Printer className="w-4 h-4 mr-2" />准备 PDF...</Button> }
);

interface CashFlowClientProps {
    data: CashFlowData;
    initialStartDate: string;
    initialEndDate: string;
}

export function CashFlowClient({ data, initialStartDate, initialEndDate }: CashFlowClientProps) {
    const router = useRouter();
    const [startDate, setStartDate] = useState(initialStartDate);
    const [endDate, setEndDate] = useState(initialEndDate);

    const handleApplyFilter = () => {
        router.push(`/finance/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`);
    };

    // 为 Excel 导出准备扁平化数据
    const excelData = [
        { title: '一、经营活动产生的现金流量', category: '' },
        { title: '经营活动现金流入小计', category: '流入', balance: data.operatingActivities.totalInflow },
        { title: '经营活动现金流出小计', category: '流出', balance: data.operatingActivities.totalOutflow },
        { title: '经营活动产生的现金流量净额', category: '净额', balance: data.operatingActivities.netCashFlow },
        { title: '', category: '' }, // 空行
        { title: '二、投资与筹资活动产生的现金流量', category: '简述', balance: 0.00 }, // 目前按项目约束先简化计算为经营流水
        { title: '', category: '' }, // 空行
        { title: '五、现金及现金等价物净增加额', category: '总计', balance: data.netIncrease },
    ];

    const excelColumns: any[] = [
        { header: '项目', accessorKey: 'title', width: 40 },
        { header: '行次分类', accessorKey: 'category', width: 20 },
        { header: '金额', accessorKey: 'balance', width: 20 },
    ];

    // 为 PDF 导出准备数据
    const pdfColumns = [
        { header: '项目', dataKey: 'title', width: '60%' },
        { header: '行次分类', dataKey: 'category', width: '20%' },
        { header: '金额', dataKey: 'balance', width: '20%' },
    ];

    return (
        <div className="space-y-6">
            <ReportNavigation />

            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>计算口径说明</AlertTitle>
                <AlertDescription>
                    当前的现金流量表为基于凭证日志中现金类科目（1001、1002等）借贷方向提取的简易版本。目前所有的现金流变动暂时计入“经营活动”栏目。
                </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">从：</span>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-auto"
                    />
                    <span className="text-sm font-medium">至：</span>
                    <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-auto"
                    />
                    <Button onClick={handleApplyFilter} variant="secondary">应用</Button>
                </div>

                <div className="flex items-center gap-2">
                    <ExcelExportButton
                        data={excelData as any}
                        columns={excelColumns as any}
                        filename={`现金流量表_${startDate}_${endDate}.xlsx`}
                    />
                    <PDFDownloadLink
                        document={
                            <ReportPdfTemplate
                                title="现金流量表 (简述版)"
                                period={`期间：${startDate} 至 ${endDate}`}
                                columns={pdfColumns}
                                data={excelData}
                            />
                        }
                        fileName={`现金流量表_${startDate}_${endDate}.pdf`}
                    >
                        {/* @ts-ignore */}
                        {({ blob, url, loading, error }) => (
                            <Button variant="outline" size="sm" disabled={loading}>
                                <FileDown className="w-4 h-4 mr-2" />
                                {loading ? '生成中...' : '导出 PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>现金流量表 (Cash Flow Statement)</CardTitle>
                    <CardDescription>展示企业在一定会计期间现金和现金等价物流入和流出的报表。</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">

                        {/* 经营活动 */}
                        <div>
                            <div className="font-bold py-2 border-b bg-muted/50 px-2 rounded-t-md">
                                一、经营活动产生的现金流量
                            </div>

                            <div className="px-4 py-2 space-y-4 border-b">
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">现金流入</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm py-1 border-b border-dashed">
                                            <span>经营活动现金流入小计</span>
                                            <span className="text-green-600 font-medium">+{data.operatingActivities.totalInflow.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">现金流出</h4>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm py-1 border-b border-dashed">
                                            <span>经营活动现金流出小计</span>
                                            <span className="text-red-500 font-medium">-{data.operatingActivities.totalOutflow.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between font-bold py-3 px-2">
                                <span>经营活动产生的现金流量净额</span>
                                <span className={data.operatingActivities.netCashFlow >= 0 ? "text-green-600" : "text-red-500"}>
                                    {data.operatingActivities.netCashFlow.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* 投资/筹资 (为了格式保持完整) */}
                        <div className="opacity-50">
                            <div className="font-bold py-2 border-b bg-muted/50 px-2">
                                二、投资与筹资活动产生的现金流量 (当前系统归类暂计为 0)
                            </div>
                        </div>

                        {/* 净增加额 */}
                        <div className="flex justify-between font-bold text-lg py-4 border-t-2 px-2 mt-4 text-primary bg-primary/5 rounded-b-md">
                            <span>五、现金及现金等价物净增加额</span>
                            <span>{data.netIncrease.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="mt-8 text-xs text-muted-foreground border-t pt-4">
                            <p>附注：现金流明细参考凭证日志记录的流出与流入。金额前带 "+" 代表流入，带 "-" 代表流出。</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
