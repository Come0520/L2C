'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { uploadFileAction } from '@/features/upload/actions/upload';
import { Loader2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

interface Props {
    onUploadComplete: (url: string) => void;
    className?: string;
    label?: string;
}

export function UploadButton({ onUploadComplete, className, label = "Upload Image" }: Props) {
    const [uploading, setUploading] = useState(false);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadFileAction(formData);
            if (res.success && res.url) {
                onUploadComplete(res.url);
                toast.success('Upload success');
            } else {
                toast.error(res.error || 'Upload failed');
            }
        } catch {
            toast.error('Network error');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    }

    return (
        <div className={cn("relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer", className)}>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                disabled={uploading}
            />
            {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-8 w-8" />
                    <span className="text-xs font-medium">{label}</span>
                </div>
            )}
        </div>
    );
}
