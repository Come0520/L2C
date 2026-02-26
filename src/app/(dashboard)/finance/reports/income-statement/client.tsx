// @ts-nocheck
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ReportNavigation } from '@/features/finance/components/report-navigation';
import { IncomeStatementData } from '@/features/finance';
import { ReportPdfTemplate } from '@/features/finance/components/report-pdf-template';
import { ExcelExportButton } from '@/shared/components/data-export/excel-export-button';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { FileDown, Printer } from 'lucide-react';

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" size="sm" disabled>
        <Printer className="mr-2 h-4 w-4" />
        准备 PDF...
      </Button>
    ),
  }
);

interface IncomeStatementClientProps {
  data: IncomeStatementData;
  initialStartDate: string;
  initialEndDate: string;
}

export function IncomeStatementClient({
  data,
  initialStartDate,
  initialEndDate,
}: IncomeStatementClientProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const handleApplyFilter = () => {
    router.push(`/finance/reports/income-statement?startDate=${startDate}&endDate=${endDate}`);
  };

  // 为 Excel 导出准备扁平化数据
  const excelData = [
    { title: '一、营业收入', category: '', balance: data.operatingIncome.total },
    ...data.operatingIncome.items.map((item) => ({
      title: `减：${item.code} ${item.name}`,
      category: '营业成本/费用',
      balance: item.balance,
    })),
    { title: '二、营业费用合计', category: '总计', balance: data.operatingExpense.total },
    { title: '', category: '' }, // 空行
    { title: '三、净利润', category: '总计', balance: data.netIncome },
  ];

  const excelColumns: any[] = [
    { header: '项目', accessorKey: 'title', width: 30 },
    { header: '类别', accessorKey: 'category', width: 15 },
    { header: '本期金额', accessorKey: 'balance', width: 20 },
  ];

  // 为 PDF 导出准备数据
  const pdfColumns = [
    { header: '项目', dataKey: 'title', width: '50%' },
    { header: '类别', dataKey: 'category', width: '25%' },
    { header: '本期金额', dataKey: 'balance', width: '25%' },
  ];

  return (
    <div className="space-y-6">
      <ReportNavigation />

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
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
          <Button onClick={handleApplyFilter} variant="secondary">
            应用
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={excelData as any}
            columns={excelColumns as any}
            filename={`利润表_${startDate}_${endDate}.xlsx`}
          />
          <PDFDownloadLink
            document={
              <ReportPdfTemplate
                title="利润表"
                period={`期间：${startDate} 至 ${endDate}`}
                columns={pdfColumns}
                data={excelData}
              />
            }
            fileName={`利润表_${startDate}_${endDate}.pdf`}
          >
            {/* @ts-ignore */}
            {({ blob, url, loading, error }) => (
              <Button variant="outline" size="sm" disabled={loading}>
                <FileDown className="mr-2 h-4 w-4" />
                {loading ? '生成中...' : '导出 PDF'}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>利润表 (Income Statement)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 收入部分 */}
            <div>
              <div className="bg-muted/50 flex justify-between rounded-t-md border-b px-2 py-2 font-bold">
                <span>一、营业收入</span>
                <span>
                  {data.operatingIncome.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="space-y-2 px-4 py-2">
                {data.operatingIncome.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b border-dashed py-1 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.code} {item.name}
                    </span>
                    <span>
                      {item.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 费用部分 */}
            <div>
              <div className="bg-muted/50 flex justify-between border-b px-2 py-2 font-bold">
                <span>二、营业费用 (减项)</span>
                <span>
                  {data.operatingExpense.total.toLocaleString('zh-CN', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="space-y-2 px-4 py-2">
                {data.operatingExpense.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b border-dashed py-1 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.code} {item.name}
                    </span>
                    <span>
                      {item.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 净利润 */}
            <div className="text-primary mt-4 flex justify-between border-t-2 px-2 py-4 text-lg font-bold">
              <span>三、净利润 (Net Income)</span>
              <span>{data.netIncome.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
