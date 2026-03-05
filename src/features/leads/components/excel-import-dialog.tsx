'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import Upload from 'lucide-react/dist/esm/icons/upload';
import FileDown from 'lucide-react/dist/esm/icons/file-down';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import { useExcelImport } from '../hooks/use-excel-import';
import { LEAD_TEMPLATE_HEADER } from '../services/excel-mapping';

interface ExcelImportDialogProps {
  onSuccess?: () => void;
}

export function ExcelImportDialog({ onSuccess }: ExcelImportDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    file,
    previewData,
    stats,
    isUploading,
    importResult,
    handleDownloadTemplate,
    handleFileChange,
    handleImport,
    resetState,
  } = useExcelImport({
    onSuccess,
  });

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // 延迟重置状态，等待关闭动画结束
      setTimeout(resetState, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          导入线索
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>批量导入线索</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Download Template & Upload */}
          <div className="glass-empty-state flex items-center gap-4 rounded-lg border-dashed p-4">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <FileDown className="mr-2 h-4 w-4" />
              下载模版
            </Button>
            <div className="flex-1">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="text-muted-foreground file:bg-primary/10 file:text-primary hover:file:bg-primary/20 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />
            </div>
          </div>

          {/* Step 2: Preview & Stats */}
          {previewData.length > 0 && !importResult && (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center justify-between text-sm">
                <span>预览前 5 条 (共 {stats?.total} 条数据)</span>
              </div>
              <div className="overflow-hidden rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {LEAD_TEMPLATE_HEADER.slice(0, 5).map((h) => (
                        <TableHead key={h}>{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.customerPhone}</TableCell>
                        <TableCell>{row.customerWechat}</TableCell>
                        <TableCell>{row.community}</TableCell>
                        <TableCell>{row.address}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Step 3: Result Feedback */}
          {importResult && (
            <div className="space-y-4">
              <Alert variant={importResult.errors.length > 0 ? 'destructive' : 'default'}>
                {importResult.errors.length > 0 ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <AlertTitle>导入完成</AlertTitle>
                <AlertDescription>
                  成功: {importResult.successCount} 条，失败: {importResult.errors.length} 条
                </AlertDescription>
              </Alert>

              {importResult.errors.length > 0 && (
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <ul className="space-y-1 text-sm text-red-600">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>
                        第 {err.row} 行: {err.error}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Step 4: Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => handleOpenChange(false)}>
              关闭
            </Button>
            {!importResult && (
              <Button onClick={handleImport} disabled={!file || isUploading}>
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认导入
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
