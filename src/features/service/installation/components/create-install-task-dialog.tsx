'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

interface CreateInstallTaskDialogProps {
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

/**
 * 新建安装任务对话框组件
 * 用于手动为订单创建新的安装单
 * 
 * @param {React.ReactNode} trigger - 自定义触发元素
 * @param {() => void} onSuccess - 创建成功后的回调
 */
export function CreateInstallTaskDialog({ trigger, onSuccess }: CreateInstallTaskDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            toast.success('安装任务已创建 (Mock)');
            onSuccess?.();
            setOpen(false);
        }, 1000);
    };

    // 默认触发按钮
    const defaultTrigger = (
        <Button>
            <Plus className="mr-2 h-4 w-4" /> 新建安装单
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>新建安装任务</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    安装单创建表单在恢复模式下暂不可见，稍后将对接完整业务逻辑。
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? '创建中...' : '提交创建'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


