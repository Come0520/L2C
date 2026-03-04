import * as React from 'react';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { UploadCloud, FileType, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Switch } from '@/shared/ui/switch';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { importExpenseRecords } from '../actions/expense-actions';

interface ImportRow {
  accountCode: string;
  amount: number;
  expenseDate: Date;
  description: string;
}

interface ExpenseImportProps {
  accounts: { id: string; name: string; code: string }[];
  onSuccess?: () => void;
}

export function ExpenseImport({ accounts, onSuccess }: ExpenseImportProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [previewData, setPreviewData] = React.useState<ImportRow[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);
  const [createVoucher, setCreateVoucher] = React.useState(false);

  // 生成并下载模板
  const handleDownloadTemplate = async () => {
    const workbook = new Workbook();

    // 费用导入模板 Sheet
    const ws = workbook.addWorksheet('费用导入模板');
    const headers = ['科目编码', '金额', '发生日期(YYYY-MM-DD)', '费用摘要'];
    ws.addRow(headers);
    ws.addRows([
      ['6602', '150.00', '2024-03-20', '打车费用'],
      ['6601', '3000.00', '2024-03-21', '部分设备维修'],
    ]);

    // 可用科目对照表 Sheet
    const wsRef = workbook.addWorksheet('可用科目对照表(仅供参考)');
    wsRef.addRow(['科目编码', '科目名称']);
    accounts.forEach((a) => wsRef.addRow([a.code, a.name]));

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), '费用批量导入模板.xlsx');
  };

  // 文件上传与解析
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const arrayBuffer = evt.target?.result as ArrayBuffer;
        const workbook = new Workbook();
        await workbook.xlsx.load(arrayBuffer);
        const ws = workbook.worksheets[0];

        if (!ws || ws.rowCount <= 1) {
          toast.error('文件中没有数据');
          setFile(null);
          setPreviewData([]);
          return;
        }

        const data: unknown[][] = [];
        ws.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // 跳过表头
          const rowValues = row.values as any[];
          // row.values 从 1 开始索引
          data.push([rowValues[1], rowValues[2], rowValues[3], rowValues[4]]);
        });

        const rows = data
          .map((row) => {
            const dateVal = row[2];
            let expenseDate = new Date(); // fallback to current date
            if (dateVal instanceof Date) {
              expenseDate = dateVal;
            } else if (dateVal) {
              const parsedDate = new Date(String(dateVal));
              if (!isNaN(parsedDate.getTime())) {
                expenseDate = parsedDate;
              }
            }
            return {
              accountCode: String(row[0] || '').trim(),
              amount: Number(row[1]) || 0,
              expenseDate,
              description: String(row[3] || '').trim(),
            };
          })
          .filter((r) => r.accountCode && r.amount > 0);

        setPreviewData(rows);
        if (rows.length === 0) toast.warning('未解析到有效数据，请检查必填列');
      } catch (_err) {
        toast.error('文件解析失败!');
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
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
        const resDetails =
          res && typeof res === 'object' && 'details' in res
            ? (res as { details: string[] }).details
            : null;
        const dataDetails = res?.data?.details;
        const details = resDetails || dataDetails;
        toast.error(res?.error || res?.data?.error, {
          description: details ? details.join('\n') : undefined,
          duration: 5000,
        });
        return;
      }

      const data = (res?.data || res) as
        | {
            success?: boolean;
            insertCount?: number;
            voucherSuccessCount?: number;
            voucherErrors?: unknown[];
          }
        | undefined;
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
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : '导入失败');
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
