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
import { Upload, FileDown, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { importLeads } from '../actions';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface ExcelImportDialogProps {
    userId: string;
    tenantId: string;
    onSuccess?: () => void;
}

const TEMPLATE_HEADER = ['客户姓名', '手机号', '微信号', '楼盘', '地址', '预估金额', '备注'];
const FIELD_MAPPING: Record<string, string> = {
    '客户姓名': 'customerName',
    '手机号': 'customerPhone',
    '微信号': 'customerWechat',
    '楼盘': 'community',
    '地址': 'address',
    '预估金额': 'estimatedAmount',
    '备注': 'remark'
};

export function ExcelImportDialog({ userId, tenantId, onSuccess }: ExcelImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [stats, setStats] = useState<{ total: number; valid: number } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState<{ successCount: number; errors: any[] } | null>(null);

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADER, ['张三', '13800138000', 'wx123', '万科城', '1栋101', '50000', '老客户推荐']]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "线索导入模版");
        XLSX.writeFile(wb, "线索导入模版.xlsx");
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setImportResult(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            // Map keys
            const mappedData = jsonData.map(row => {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    if (FIELD_MAPPING[key]) {
                        newRow[FIELD_MAPPING[key]] = row[key];
                    }
                });
                return newRow;
            });

            setPreviewData(mappedData.slice(0, 5)); // Preview first 5
            setStats({ total: mappedData.length, valid: mappedData.length }); // Simple stat
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleImport = async () => {
        if (!file) return;
        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                // Map keys
                const mappedData = jsonData.map(row => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        if (FIELD_MAPPING[key]) {
                            newRow[FIELD_MAPPING[key]] = String(row[key] || '').trim();
                        }
                    });
                    return newRow;
                });

                const result = await importLeads(mappedData, userId, tenantId);
                setImportResult(result);

                if (result.successCount > 0) {
                    toast.success(`成功导入 ${result.successCount} 条线索`);
                    onSuccess?.();
                }

                if (result.errors.length > 0) {
                    toast.warning(`${result.errors.length} 条数据导入失败，请查看详情`);
                }

            } catch (err: any) {
                toast.error('导入失败: ' + err.message);
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <FileDown className="mr-2 h-4 w-4" />
                            下载模版
                        </Button>
                        <div className="flex-1">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            />
                        </div>
                    </div>

                    {/* Step 2: Preview & Stats */}
                    {previewData.length > 0 && !importResult && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>预览前 5 条 (共 {stats?.total} 条数据)</span>
                            </div>
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {TEMPLATE_HEADER.slice(0, 5).map(h => <TableHead key={h}>{h}</TableHead>)}
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
                            <Alert variant={importResult.errors.length > 0 ? "destructive" : "default"}>
                                {importResult.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                <AlertTitle>导入完成</AlertTitle>
                                <AlertDescription>
                                    成功: {importResult.successCount} 条，失败: {importResult.errors.length} 条
                                </AlertDescription>
                            </Alert>

                            {importResult.errors.length > 0 && (
                                <ScrollArea className="h-[200px] border rounded-md p-2">
                                    <ul className="space-y-1 text-sm text-red-600">
                                        {importResult.errors.map((err, i) => (
                                            <li key={i}>第 {err.row} 行: {err.error}</li>
                                        ))}
                                    </ul>
                                </ScrollArea>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>关闭</Button>
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
