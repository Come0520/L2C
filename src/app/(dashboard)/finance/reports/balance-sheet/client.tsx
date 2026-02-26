// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';
import { ReportNavigation } from '@/features/finance/components/report-navigation';
import { BalanceSheetData } from '@/features/finance';
import { ReportPdfTemplate } from '@/features/finance/components/report-pdf-template';
import { ExcelExportButton } from '@/shared/components/data-export/excel-export-button';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { FileDown, Printer } from 'lucide-react';

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
    { ssr: false, loading: () => <Button variant="outline" size="sm" disabled><Printer className="w-4 h-4 mr-2" />准备 PDF...</Button> }
);

interface BalanceSheetClientProps {
    data: BalanceSheetData;
    initialDate: string;
}

export function BalanceSheetClient({ data, initialDate }: BalanceSheetClientProps) {
    const router = useRouter();
    const [date, setDate] = useState(initialDate.split('T')[0]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDate(e.target.value);
        router.push(`/finance/reports/balance-sheet?date=${e.target.value}`);
    };

    // 为 Excel 导出准备扁平化数据
    const excelData = [
        { title: '资产', category: '' },
        ...data.assets.items.map(item => ({ title: `${item.code} ${item.name}`, category: '资产', balance: item.balance })),
        { title: '资产合计', category: '总计', balance: data.assets.total },
        { title: '', category: '' }, // 空行
        { title: '负债', category: '' },
        ...data.liabilities.items.map(item => ({ title: `${item.code} ${item.name}`, category: '负债', balance: item.balance })),
        { title: '负债合计', category: '总计', balance: data.liabilities.total },
        { title: '', category: '' }, // 空行
        { title: '所有者权益', category: '' },
        ...data.equity.items.map(item => ({ title: `${item.code} ${item.name}`, category: '所有者权益', balance: item.balance })),
        { title: '所有者权益合计', category: '总计', balance: data.equity.total },
    ];

    const excelColumns: any[] = [
        { header: '项目', accessorKey: 'title', width: 30 },
        { header: '类别', accessorKey: 'category', width: 15 },
        { header: '期末余额', accessorKey: 'balance', width: 20 },
    ];

    // 为 PDF 导出准备数据
    const pdfColumns = [
        { header: '项目', dataKey: 'title', width: '50%' },
        { header: '类别', dataKey: 'category', width: '25%' },
        { header: '期末余额', dataKey: 'balance', width: '25%' },
    ];

    return (
        <div className="space-y-6">
            <ReportNavigation />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">截止日期：</span>
                    <Input
                        type="date"
                        value={date}
                        onChange={handleDateChange}
                        className="w-auto"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <ExcelExportButton
                        data={excelData}
                        columns={excelColumns}
                        filename={`资产负债表_${date}.xlsx`}
                        sheetName="资产负债表"
                    />
                    <PDFDownloadLink
                        document={
                            <ReportPdfTemplate
                                title="资产负债表"
                                period={`截至日期：${date}`}
                                columns={pdfColumns}
                                data={excelData}
                            />
                        }
                        fileName={`资产负债表_${date}.pdf`}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 左侧：资产 */}
                <Card>
                    <CardHeader>
                        <CardTitle>资产</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.assets.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm py-1 border-b">
                                    <span>{item.code} {item.name}</span>
                                    <span>{item.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold pt-4">
                                <span>资产总计</span>
                                <span>{data.assets.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 右侧：负债和权益 */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>负债</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {data.liabilities.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm py-1 border-b">
                                        <span>{item.code} {item.name}</span>
                                        <span>{item.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold pt-4">
                                    <span>负债合计</span>
                                    <span>{data.liabilities.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>所有者权益</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {data.equity.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm py-1 border-b">
                                        <span>{item.code} {item.name}</span>
                                        <span>{item.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between font-bold pt-4">
                                    <span>所有者权益合计</span>
                                    <span>{data.equity.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 校验提示 */}
            {!data.isBalanced && (
                <div className="p-4 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                    警告：当前资产负债表不平衡（资产总计 ≠ 负债合计 + 所有者权益合计），差异金额为 {Math.abs(data.assets.total - data.liabilities.total - data.equity.total).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}。请检查是否有未过账科目或凭证错误。
                </div>
            )}
        </div>
    );
}
