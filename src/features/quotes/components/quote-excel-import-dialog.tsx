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
import { Upload, FileDown, AlertCircle, CheckCircle, Loader2, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { batchImportQuoteItems } from '@/features/quotes/actions/import-actions';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface QuoteExcelImportDialogProps {
    quoteId: string;
    onSuccess?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

// 空间名称 | 商品名称 | 宽 | 高 | 数量 | 单价 | 备注
const TEMPLATE_HEADER = ['空间名称', '商品名称', '宽(cm)', '高(cm)', '数量', '单价', '备注'];
const FIELD_MAPPING: Record<string, string> = {
    '空间名称': 'roomName',
    '商品名称': 'productName',
    '宽(cm)': 'width',
    '高(cm)': 'height',
    '数量': 'quantity',
    '单价': 'unitPrice',
    '备注': 'remark'
};

export function QuoteExcelImportDialog({ quoteId, onSuccess, open: directedOpen, onOpenChange: setDirectedOpen }: QuoteExcelImportDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isOpen = directedOpen !== undefined ? directedOpen : internalOpen;
    const setIsOpen = setDirectedOpen || setInternalOpen;

    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [stats, setStats] = useState<{ total: number; rooms: number } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState<{ successCount: number; errors: any[] } | null>(null);

    const downloadTemplate = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            TEMPLATE_HEADER,
            ['主卧', '米兰绒窗帘', '300', '260', '1', '280', '包含轨道'],
            ['主卧', '窗纱', '300', '260', '1', '120', ''],
            ['客厅', '电动梦幻帘', '400', '260', '1', '580', ''],
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "报价单导入模版");
        XLSX.writeFile(wb, "报价导入模版.xlsx");
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

            // Map and Validate
            const mappedData: any[] = [];
            const rooms = new Set<string>();

            jsonData.forEach(row => {
                const newRow: any = {};
                Object.keys(row).forEach(key => {
                    // Simple fuzzy match for headers if needed, but exact match for now
                    const targetKey = FIELD_MAPPING[key] || FIELD_MAPPING[key.trim()];
                    if (targetKey) {
                        newRow[targetKey] = row[key];
                    }
                });

                // Basic defaults
                if (!newRow.productName) return; // Skip empty rows
                if (newRow.roomName) rooms.add(newRow.roomName);

                mappedData.push(newRow);
            });

            setPreviewData(mappedData.slice(0, 5));
            setStats({ total: mappedData.length, rooms: rooms.size });
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

                // Mapped
                const items: any[] = jsonData.map(row => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        const targetKey = FIELD_MAPPING[key] || FIELD_MAPPING[key.trim()];
                        if (targetKey) newRow[targetKey] = row[key];
                    });
                    return {
                        roomName: String(newRow.roomName || '未分配').trim(),
                        productName: String(newRow.productName || '').trim(),
                        width: Number(newRow.width) || 0,
                        height: Number(newRow.height) || 0,
                        quantity: Number(newRow.quantity) || 1,
                        unitPrice: Number(newRow.unitPrice) || 0,
                        remark: String(newRow.remark || ''),
                    };
                }).filter(i => i.productName); // valid items only

                const result = await batchImportQuoteItems(quoteId, items);
                setImportResult(result);

                if (result.successCount > 0) {
                    toast.success(`成功导入 ${result.successCount} 条明细`);
                    onSuccess?.();
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>批量导入报价明细 (Excel)</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex items-center gap-4 p-4 rounded-lg glass-empty-state border-dashed">
                        <Button variant="outline" size="sm" onClick={downloadTemplate}>
                            <FileDown className="mr-2 h-4 w-4" />
                            下载模版
                        </Button>
                        <div className="flex-1">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                        </div>
                    </div>

                    {/* Step 2 Preview */}
                    {stats && !importResult && (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>预览前 5 条 (共 {stats.total} 条明细, 涉及 {stats.rooms} 个空间)</span>
                            </div>
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>空间</TableHead>
                                            <TableHead>商品</TableHead>
                                            <TableHead>尺寸</TableHead>
                                            <TableHead>数量</TableHead>
                                            <TableHead>单价</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {previewData.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{row.roomName || '未分配'}</TableCell>
                                                <TableCell>{row.productName}</TableCell>
                                                <TableCell>{row.width}x{row.height}</TableCell>
                                                <TableCell>{row.quantity}</TableCell>
                                                <TableCell>{row.unitPrice}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Step 3 Result */}
                    {importResult && (
                        <div className="space-y-4">
                            <Alert variant={importResult.errors.length > 0 ? "destructive" : "default"}>
                                {importResult.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                <AlertTitle>导入完成</AlertTitle>
                                <AlertDescription>
                                    成功: {importResult.successCount} 条，失败: {importResult.errors.length} 条
                                </AlertDescription>
                            </Alert>
                            <div className="flex justify-end">
                                <Button onClick={() => setIsOpen(false)}>完成</Button>
                            </div>
                        </div>
                    )}

                    {!importResult && (
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>取消</Button>
                            <Button onClick={handleImport} disabled={!file || isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                开始导入
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
