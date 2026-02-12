'use client';

import { Button } from '@/shared/ui/button';
import { X } from 'lucide-react';
import { UploadButton } from '@/shared/components/upload-button';

interface PhotoUploadProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  maxFiles?: number;
}

export function PhotoUpload({ value = [], onChange, maxFiles = 5 }: PhotoUploadProps) {
  const handleUploadComplete = (url: string) => {
    if (onChange) {
      onChange([...value, url]);
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
          <div key={index} className="group relative h-24 w-24 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Uploaded" className="h-full w-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 h-6 w-6 rounded-none rounded-bl-md opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {value.length < maxFiles && (
          <div className="h-24 w-24">
            <UploadButton
              onUploadComplete={handleUploadComplete}
              className="h-full w-full"
              label="Upload"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export async function compressImage(file: File): Promise<Blob> {
  // Mock compression or just return file
  return file;
}
