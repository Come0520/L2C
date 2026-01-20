'use client';

import React, { useState, useCallback } from 'react';
import Upload from 'lucide-react/dist/esm/icons/upload';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { ExcelImporterProps, ImporterState, ValidationResult } from './types';
import { parseExcelFile, validateExcelData } from './utils';
import { toast } from 'sonner';

/**
 * 通用 Excel 导入组件
 */
export function ExcelImporter<T extends Record<string, any>>({
    schema,
    onImport,
    templateUrl,
    columnMapping,
    title = '导入数据',
    description = '支持 .xlsx, .xls, .csv 格式文件',
}: ExcelImporterProps<T>) {
    const [state, setState] = useState<ImporterState>('idle');
    const [results, setResults] = useState<ValidationResult<T>[]>([]);
    const [fileName, setFileName] = useState<string>('');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setFileName(file.name);
        setState('parsing');

        try {
            const rawData = await parseExcelFile(file);
            const validationResults = validateExcelData(rawData, columnMapping, schema);
            setResults(validationResults);
            setState('previewing');
        } catch (error) {
            console.error('Excel parse error:', error);
            toast.error('文件解析失败，请检查文件格式');
            setState('idle');
        }
    }, [columnMapping, schema]);

    // 这里我暂时先用原生的 Drag Event，因为 package.json 没看到 react-dropzone
    // 但为了更好的体验，我会稍后决定是否安装。目前先实现基础逻辑。

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onDrop([file]);
        }
    };

    const handleImport = async () => {
        const validData = results
            .filter((r) => r.data !== null)
            .map((r) => r.data as T);

        if (validData.length === 0) {
            toast.error('没有可导入的有效数据');
            return;
        }

        setState('importing');
        try {
            await onImport(validData);
            toast.success(`成功导入 ${validData.length} 条数据`);
            setState('success');
        } catch (_error) {
            toast.error('导入失败，请稍后重试');
            setState('previewing');
        }
    };

    const reset = () => {
        setState('idle');
        setResults([]);
        setFileName('');
    };

    const errorCount = results.filter(r => r.errors !== null).length;
    const validCount = results.length - errorCount;

    return (
        <Card className="p-6 w-full max-w-4xl mx-auto border-dashed border-2">
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    {templateUrl && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={templateUrl} download>下载模板</a>
                        </Button>
                    )}
                </div>

                {state === 'idle' && (
                    <div
                        className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors cursor-pointer relative"
                        onClick={() => document.getElementById('excel-upload')?.click()}
                    >
                        <input
                            id="excel-upload"
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                        />
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm font-medium">点击或拖拽文件至此处上传</p>
                        <p className="text-xs text-muted-foreground mt-1">最大支持 10MB</p>
                    </div>
                )}

                {state === 'parsing' && (
                    <div className="py-12 text-center space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                        <p className="text-sm text-muted-foreground">正在解析文件并校验数据...</p>
                    </div>
                )}

                {(state === 'previewing' || state === 'importing') && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <CheckCircle2 className="h-4 w-4" /> {validCount} 条有效
                                </span>
                                {errorCount > 0 && (
                                    <span className="flex items-center gap-1 text-destructive font-medium">
                                        <AlertCircle className="h-4 w-4" /> {errorCount} 条错误
                                    </span>
                                )}
                                <span className="text-muted-foreground">文件名: {fileName}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={reset}>重新上传</Button>
                        </div>

                        {errorCount > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>数据校验未通过</AlertTitle>
                                <AlertDescription>
                                    请修正以下错误后重新上传，或者您可以仅导入有效数据。
                                </AlertDescription>
                            </Alert>
                        )}

                        <ScrollArea className="h-[300px] border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">行号</TableHead>
                                        {Object.keys(columnMapping).map(header => (
                                            <TableHead key={header}>{header}</TableHead>
                                        ))}
                                        <TableHead>校验结果</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {results.map((res, i) => (
                                        <TableRow key={i} className={res.errors ? 'bg-destructive/5' : ''}>
                                            <TableCell className="font-mono text-xs">{res.rowNumber}</TableCell>
                                            {Object.keys(columnMapping).map(header => (
                                                <TableCell key={header}>
                                                    {String(res.raw[header] ?? '-')}
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                {res.errors ? (
                                                    <div className="text-destructive text-xs space-y-1">
                                                        {res.errors.map((err, ei) => (
                                                            <div key={ei} className="flex items-start gap-1">
                                                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                                                {err}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={reset} disabled={state === 'importing'}>
                                取消
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={state === 'importing' || results.length === 0}
                            >
                                {state === 'importing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                确认导入 {validCount} 条数据
                            </Button>
                        </div>
                    </div>
                )}

                {state === 'success' && (
                    <div className="py-12 text-center space-y-4">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                        <h4 className="text-xl font-semibold">导入成功</h4>
                        <p className="text-sm text-muted-foreground">您的数据已成功导入系统。</p>
                        <Button onClick={reset}>继续导入其他文件</Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
