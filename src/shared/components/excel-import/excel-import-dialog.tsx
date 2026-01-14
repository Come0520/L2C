'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Upload } from 'lucide-react';

export function ExcelImportDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Excel</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                     <p className="text-muted-foreground">Import feature not available in recovery mode.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
