'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import Upload from 'lucide-react/dist/esm/icons/upload';
import X from 'lucide-react/dist/esm/icons/x';

interface PhotoUploadProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    maxFiles?: number;
}

export function PhotoUpload({ value = [], onChange, maxFiles = 5 }: PhotoUploadProps) {
    const handleUpload = () => {
        // Mock upload
        if (onChange) {
            onChange([...value, 'https://placehold.co/100']);
        }
    };

    const handleRemove = (index: number) => {
        if (onChange) {
            const newValue = [...value];
            newValue.splice(index, 1);
            onChange(newValue);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {value.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 border rounded-md overflow-hidden">
                        <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 h-6 w-6 rounded-none rounded-bl-md"
                            onClick={() => handleRemove(index)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
                {value.length < maxFiles && (
                    <Button variant="outline" className="w-24 h-24 flex flex-col items-center justify-center gap-2" onClick={handleUpload}>
                        <Upload className="h-6 w-6" />
                        <span className="text-xs">Upload</span>
                    </Button>
                )}
            </div>
        </div>
    );
}

export async function compressImage(file: File): Promise<Blob> {
    // Mock compression or just return file
    return file;
}
