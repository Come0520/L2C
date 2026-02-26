// @ts-nocheck
'use client';

import * as React from 'react';
import * as xlsx from 'xlsx';
import { toast } from 'sonner';
import { UploadCloud, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { importExpenseRecords } from '../actions/expense-actions';

interface ExpenseImportProps {
  accounts: { id: string; name: string; code: string }[];
  onSuccess?: () => void;
}

export function ExpenseImport({ accounts, onSuccess }: ExpenseImportProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewData, setPreviewData] = React.useState<any[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [createVoucher, setCreateVoucher] = React.useState(false);

  // 生成并下载模板
  const handleDownloadTemplate = () => {
    const wb = xlsx.utils.book_new();
    // 表头
    const headers = [['科目编码', '金额', '发生日期(YYYY-MM-DD)', '费用摘要']];
    // 示例数据
    const examples = [
      ['6602', '150.00', '2024-03-20', '打车费用'],
      ['6601', '3000.00', '2024-03-21', '部分设备维修'],
    ];

    const ws = xlsx.utils.aoa_to_sheet([...headers, ...examples]);

    // 可选：添加科目对照表用于参考
    const accountRef = [['科目编码', '科目名称']];
    accounts.forEach((a) => accountRef.push([a.code, a.name]));
    const wsRef = xlsx.utils.aoa_to_sheet(accountRef);

    xlsx.utils.book_append_sheet(wb, ws, '费用导入模板');
    xlsx.utils.book_append_sheet(wb, wsRef, '可用科目对照表(仅供参考)');

    xlsx.writeFile(wb, '费用批量导入模板.xlsx');
  };

  // 文件上传与解析
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // 将 Excel 转换为 JSON 对象数组，跳过表头
        const data = xlsx.utils.sheet_to_json(ws, { header: 1 });
        if (data.length <= 1) {
          toast.error('文件中没有数据');
          setFile(null);
          setPreviewData([]);
          return;
        }

        // 取数据体 (跳过第一行 header)
        const rows = data
          .slice(1)
          .map((row: any) => ({
            accountCode: String(row[0]).trim(),
            amount: Number(row[1]) || 0,
            expenseDate: row[2] instanceof Date ? row[2] : new Date(String(row[2])),
            description: String(row[3] || '').trim(),
          }))
          .filter((r: any) => r.accountCode && r.amount > 0);

        setPreviewData(rows);
        if (rows.length === 0) toast.warning('未解析到有效数据，请检查必填列');
      } catch (_err: any) {
        toast.error('文件解析失败!');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleImportSubmit = async () => {
    if (previewData.length === 0) {
      toast.error('没有可导入的数据');
      return;
    }

    try {
      setIsImporting(true);
      const res = await importExpenseRecords({ rows: previewData, createVoucher });

      if (res?.error || res?.data?.error) {
        const details = (res as any)?.details || res?.data?.details;
        toast.error(res?.error || res?.data?.error, {
          description: details ? details.join('\n') : undefined,
          duration: 5000,
        });
        return;
      }

      const data = res?.data || res;
      if (data?.success) {
        let msg = `成功导入 ${data.insertCount} 条记录。`;
        if (createVoucher) {
          msg += `同步生成 ${data.voucherSuccessCount} 张凭证。`;
        }
        toast.success(msg);

        if (data.voucherErrors && data.voucherErrors.length > 0) {
          console.error('部分凭证生成失败:', data.voucherErrors);
          toast.warning(`有 ${data.voucherErrors.length} 笔凭证生成失败，请在控制台查看详情`);
        }

        // reset
        setFile(null);
        setPreviewData([]);
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.message || '导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/10 flex flex-col items-center justify-between gap-4 rounded-lg border p-4 md:flex-row">
        <div className="flex items-center gap-2">
          <FileType className="text-muted-foreground h-5 w-5" />
          <div>
            <h4 className="text-sm font-medium">第一步：下载导入模板</h4>
            <p className="text-muted-foreground text-xs">请严格按照模板格式填写数据</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          下载模板
        </Button>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="mb-4 flex items-center gap-2">
          <UploadCloud className="text-muted-foreground h-5 w-5" />
          <div>
            <h4 className="text-sm font-medium">第二步：上传文件批量导入</h4>
            <p className="text-muted-foreground text-xs">支持 .xlsx / .xls 格式</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Input
            id="excel-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="max-w-xs"
          />
          {isParsing && (
            <span className="text-muted-foreground flex items-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 解析中...
            </span>
          )}
        </div>

        {previewData.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">数据预览 (共 {previewData.length} 条)</span>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="p-2 text-left">科目编码</th>
                    <th className="p-2 text-left">金额</th>
                    <th className="p-2 text-left">日期</th>
                    <th className="p-2 text-left">摘要</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="max-w-[100px] truncate p-2">{row.accountCode}</td>
                      <td className="p-2 font-medium text-orange-600">{row.amount.toFixed(2)}</td>
                      <td className="p-2">
                        {row.expenseDate instanceof Date
                          ? row.expenseDate.toISOString().split('T')[0]
                          : 'N/A'}
                      </td>
                      <td className="max-w-[200px] truncate p-2">{row.description}</td>
                    </tr>
                  ))}
                  {previewData.length > 50 && (
                    <tr>
                      <td colSpan={4} className="text-muted-foreground bg-muted/20 p-2 text-center">
                        ... 只显示前 50 条预览 ...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-muted/30 mt-6 flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="import-voucher"
                  checked={createVoucher}
                  onCheckedChange={setCreateVoucher}
                />
                <Label htmlFor="import-voucher">同时自动生成对应的会计凭证</Label>
              </div>
              <Button onClick={handleImportSubmit} disabled={isImporting}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认导入
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
