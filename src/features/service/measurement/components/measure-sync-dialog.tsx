'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

interface MeasureSyncDialogProps {
    open: boolean;
    onClose: () => void;
    tasks: any[];
    onSync: (selectedIds: string[]) => Promise<void>;
}

export function MeasureSyncDialog({ open, onClose, tasks, onSync }: MeasureSyncDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    const handleApplySync = async () => {
        setSubmitting(true);
        try {
            await onSync(Array.from(selectedItemIds));
            onClose();
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>同步测量数据</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                        请确认以下测量项的尺寸变更，并选择需要同步到报价单的项目。
                    </p>
                    <div className="border rounded-md p-8 text-center text-muted-foreground">
                        测量同步功能正在恢复中...
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex justify-between items-center w-full">
                        <div className="text-sm text-muted-foreground">
                            已选择 {selectedItemIds.size} 项进行同步
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>取消</Button>
                            <Button
                                onClick={handleApplySync}
                                disabled={submitting || selectedItemIds.size === 0}
                            >
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                应用同步
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
