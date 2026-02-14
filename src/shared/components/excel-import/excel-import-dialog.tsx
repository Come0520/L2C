'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import Upload from 'lucide-react/dist/esm/icons/upload';
import { ExcelImporter } from './excel-importer';
import { z } from 'zod';

/**
 * 这是一个示例 Dialog，展示如何使用 ExcelImporter
 * 实际使用时，建议根据业务需求在对应的 feature 目录下创建专门的导入逻辑
 */
export function ExcelImportDialog() {
    const [open, setOpen] = useState(false);

    // 示例 Schema: 客户导入
    const customerSchema = z.object({
        name: z.string().min(1, '姓名必填'),
        phone: z.string().min(11, '电话格式不正确'),
        email: z.string().email('邮箱格式不正确').optional(),
    });

    const handleImport = async (_data: Record<string, unknown>[]) => {
        // 模拟 API 调用
        await new Promise(resolve => setTimeout(resolve, 1500));
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    导入 Excel
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>批量导入数据</DialogTitle>
                </DialogHeader>
                <div className="p-6">
                    <ExcelImporter
                        schema={customerSchema}
                        onImport={handleImport}
                        columnMapping={{
                            '姓名': 'name',
                            '联系电话': 'phone',
                            '电子邮箱': 'email'
                        }}
                        title="上传客户资料"
                        description="请下载模板并填写后上传。系统将自动校验数据的有效性。"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
