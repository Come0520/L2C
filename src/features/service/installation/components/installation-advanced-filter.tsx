'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
// import { Button } from '@/shared/ui/button';

/**
 * 安装高级筛选对话框属性
 */
interface InstallationAdvancedFilterProps {
    /** 对话框是否打开 */
    open: boolean;
    /** 打开状态变更回调 */
    onOpenChange: (open: boolean) => void;
}

/**
 * 安装高级筛选对话框
 * 
 * 提供复杂的组合筛选功能。
 * 注意：目前处于系统恢复模式，部分高级功能暂不可用。
 */
export function InstallationAdvancedFilter({ open, onOpenChange }: InstallationAdvancedFilterProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Advanced Filters</DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center text-muted-foreground">
                    Advanced filters not available in recovery mode.
                </div>
            </DialogContent>
        </Dialog>
    );
}
