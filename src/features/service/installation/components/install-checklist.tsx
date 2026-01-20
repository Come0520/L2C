'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Upload } from 'lucide-react';
import { updateInstallChecklist } from '@/features/service/installation/actions';
import { toast } from 'sonner';

interface InstallChecklistProps {
    taskId: string;
    initialStatus: { items?: ChecklistItem[] } | null;
}

interface ChecklistItem {
    id: string;
    label: string;
    isChecked: boolean;
    photoUrl?: string;
    required: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
    { id: 'track_smooth', label: '轨道滑轮运行是否顺滑', isChecked: false, required: true },
    { id: 'steam_ironing', label: '窗帘是否已用蒸汽挂烫机进行垂直熨烫', isChecked: false, required: true },
    { id: 'folding', label: '褶皱是否已按工艺要求进行手工调整', isChecked: false, required: true },
    { id: 'clean_up', label: '现场垃圾是否已清理并带走', isChecked: false, required: true },
];

export function InstallChecklist({ taskId, initialStatus }: InstallChecklistProps) {
    const [items, setItems] = useState<ChecklistItem[]>(() => {
        if (initialStatus?.items && initialStatus.items.length > 0) {
            return initialStatus.items;
        }
        return DEFAULT_ITEMS;
    });
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        // Sync with server if initialStatus changes significantly (e.g. loaded later)
        if (initialStatus?.items && initialStatus.items.length > 0) {
            // eslint-disable-next-line
            setItems(initialStatus.items);
        }
    }, [initialStatus]);

    const handleCheck = (id: string, checked: boolean) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, isChecked: checked } : item
        ));
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateInstallChecklist({
                taskId,
                items
            });
            if (result.success) {
                toast.success('检查项已保存');
            } else {
                toast.error(result.error);
            }
        });
    };

    // Note: Photo upload logic simplifies here for brevity. 
    // Real implementation needs file input and OSS upload.
    const handlePhotoUpload = async (_id: string, _file: File) => {
        // Mock upload for now or implement real OSS logic
        // TODO: Implement Real OSS Upload
        toast.info("上传功能集成中...");
    };

    return (
        <div className="space-y-4 border p-4 rounded-md">
            <h3 className="font-medium text-lg">标准化作业清单</h3>
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id={item.id}
                                checked={item.isChecked}
                                onCheckedChange={(c) => handleCheck(item.id, c as boolean)}
                            />
                            <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                {item.label}
                                {item.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`upload-${item.id}`)?.click()}>
                            <Upload className="w-4 h-4 mr-1" />
                            {item.photoUrl ? '已上传' : '上传照片'}
                        </Button>
                        <input
                            type="file"
                            id={`upload-${item.id}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePhotoUpload(item.id, file);
                            }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isPending}>
                    {isPending ? '保存中...' : '保存进度'}
                </Button>
            </div>
        </div>
    );
}
