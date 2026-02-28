'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Images, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { toast } from 'sonner';
import { uploadFileAction } from '@/features/upload/actions/upload';
import { batchUpdateProductImages } from '@/features/products/actions/mutations';

interface ProductImageBatchUploadDialogProps {
    onSuccess?: () => void;
}

interface ParsedFile {
    file: File;
    sku: string;
    type: 'images' | 'materialImages' | 'sceneImages';
    status: 'pending' | 'uploading' | 'success' | 'error';
    url?: string;
    error?: string;
}

export function ProductImageBatchUploadDialog({ onSuccess }: ProductImageBatchUploadDialogProps) {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState<ParsedFile[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // 解析文件名以提取 SKU 和图片类型
    const parseFilename = (filename: string): { sku: string; type: 'images' | 'materialImages' | 'sceneImages' } | null => {
        // 预期格式: [SKU]-主图-1.jpg
        const match = filename.match(/^(.+?)-(主图|材质图|场景图)(?:-\d+)?\.[a-zA-Z0-9]+$/);
        if (!match) return null;

        const [, sku, typeStr] = match;
        let type: 'images' | 'materialImages' | 'sceneImages';

        switch (typeStr) {
            case '主图': type = 'images'; break;
            case '材质图': type = 'materialImages'; break;
            case '场景图': type = 'sceneImages'; break;
            default: return null;
        }

        return { sku, type };
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const parsed: ParsedFile[] = [];

        selectedFiles.forEach(file => {
            const info = parseFilename(file.name);
            if (info) {
                parsed.push({ file, sku: info.sku, type: info.type, status: 'pending' });
            } else {
                toast.warning(`文件 ${file.name} 命名不符合规范，将被忽略`);
            }
        });

        setFiles(prev => [...prev, ...parsed]);
        e.target.value = ''; // 允许重复选择相同文件
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setIsProcessing(true);

        const updatedFiles = [...files];
        const groupedResults: Record<string, { images: string[]; materialImages: string[]; sceneImages: string[] }> = {};

        for (let i = 0; i < updatedFiles.length; i++) {
            const fileItem = updatedFiles[i];
            if (fileItem.status === 'success') continue;

            fileItem.status = 'uploading';
            setFiles([...updatedFiles]);

            try {
                const formData = new FormData();
                formData.append('file', fileItem.file);
                const res = await uploadFileAction(formData);

                if (res.success && res.url) {
                    fileItem.status = 'success';
                    fileItem.url = res.url;

                    if (!groupedResults[fileItem.sku]) {
                        groupedResults[fileItem.sku] = { images: [], materialImages: [], sceneImages: [] };
                    }
                    groupedResults[fileItem.sku][fileItem.type].push(res.url);

                } else {
                    fileItem.status = 'error';
                    fileItem.error = res.error || '上传失败';
                }
            } catch (err) {
                fileItem.status = 'error';
                fileItem.error = err instanceof Error ? err.message : '网络错误';
            }
            setFiles([...updatedFiles]);
        }

        // 第二阶段：批量绑定 SKU
        const skuUpdates = Object.entries(groupedResults).map(([sku, data]) => ({ sku, ...data }));

        if (skuUpdates.length > 0) {
            try {
                const result = await batchUpdateProductImages(skuUpdates);
                if (result.success && result.data) {
                    const { successCount, errorCount } = result.data;
                    if (errorCount > 0) {
                        toast.warning(`匹配完成：成功更新 ${successCount} 个商品的图库，失败 ${errorCount} 个`);
                    } else {
                        toast.success(`成功更新 ${successCount} 个商品的图库`);
                        setOpen(false);
                        onSuccess?.();
                    }
                }
            } catch (_err) {
                toast.error('批量绑定图库时发生异常');
            }
        }

        setIsProcessing(false);
    };

    const pendingCount = files.filter(f => f.status === 'pending').length;

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!isProcessing) setOpen(val); }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Images className="mr-2 h-4 w-4" />
                    批量上传图库
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none">
                <div className="bg-background rounded-lg border shadow-lg overflow-hidden flex flex-col h-[80vh]">
                    <DialogHeader className="p-6 border-b bg-muted/30">
                        <DialogTitle className="text-xl">批量图片匹配上传</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                请确保图片按照以下格式命名以供自动匹配：<b>[SKU型号]-主图-1.jpg</b>、<b>[SKU型号]-材质图-2.png</b>、<b>[SKU型号]-场景图-1.jpg</b>。选择多张图片后，系统将一次性上传并绑定到对应的商品 SKU 下。
                            </AlertDescription>
                        </Alert>

                        <div className="flex items-center gap-4">
                            <Button onClick={() => document.getElementById('image-batch-upload')?.click()} disabled={isProcessing}>
                                选择图片文件...
                            </Button>
                            <input
                                id="image-batch-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                            />
                            <span className="text-sm text-muted-foreground">已解析 {files.length} 个合法文件</span>
                        </div>

                        {files.length > 0 && (
                            <ScrollArea className="h-[350px] border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>文件名</TableHead>
                                            <TableHead>匹配 SKU</TableHead>
                                            <TableHead>图库类型</TableHead>
                                            <TableHead>状态</TableHead>
                                            <TableHead className="w-20 text-right">操作</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {files.map((file, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="max-w-[200px] truncate" title={file.file.name}>{file.file.name}</TableCell>
                                                <TableCell className="font-mono text-xs font-semibold">{file.sku}</TableCell>
                                                <TableCell>
                                                    {file.type === 'images' && '主图'}
                                                    {file.type === 'materialImages' && '材质图'}
                                                    {file.type === 'sceneImages' && '场景图'}
                                                </TableCell>
                                                <TableCell>
                                                    {file.status === 'pending' && <span className="text-muted-foreground text-xs">等待上传</span>}
                                                    {file.status === 'uploading' && <span className="text-blue-500 text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> 上传中</span>}
                                                    {file.status === 'success' && <span className="text-green-600 text-xs flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 成功</span>}
                                                    {file.status === 'error' && <span className="text-destructive text-xs truncate max-w-[100px]" title={file.error}>{file.error}</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive text-xs hover:text-destructive hover:bg-destructive/10 h-7"
                                                        onClick={() => handleRemoveFile(i)}
                                                        disabled={isProcessing || file.status === 'success'}
                                                    >
                                                        移除
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
                                取消
                            </Button>
                            <Button onClick={handleUpload} disabled={isProcessing || pendingCount === 0}>
                                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isProcessing ? '处理中...' : (pendingCount > 0 ? `开始上传 ${pendingCount} 个文件` : '暂无待上传文件')}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
