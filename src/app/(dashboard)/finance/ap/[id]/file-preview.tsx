
'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Eye } from 'lucide-react';
import { FilePreviewDialog } from '@/shared/components/file-preview-dialog';

export function ApFilePreview({ url }: { url: string }) {
    const [open, setOpen] = useState(false);

    if (!url) return null;

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
                <Eye className="h-4 w-4" />
            </Button>
            <FilePreviewDialog
                open={open}
                onOpenChange={setOpen}
                url={url}
                fileName="支付凭证"
            />
        </>
    );
}
