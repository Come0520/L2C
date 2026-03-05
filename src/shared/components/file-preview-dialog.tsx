'use client';

import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';
import { useState } from 'react';

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  fileName?: string;
  fileType?: 'image' | 'pdf'; // Simple detection if not provided
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  url,
  fileName = '附件预览',
  fileType,
}: FilePreviewDialogProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const isPdf = fileType === 'pdf' || url.toLowerCase().endsWith('.pdf');

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const resetTransform = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetTransform();
        onOpenChange(val);
      }}
    >
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden border-zinc-800 bg-zinc-950/90 p-0 backdrop-blur-xl">
        {/* Header Toolbar */}
        <div className="z-50 flex shrink-0 items-center justify-between border-b border-white/10 bg-black/20 p-4">
          <div className="flex items-center gap-4">
            <DialogTitle className="font-medium tracking-tight text-zinc-100">
              {fileName}
            </DialogTitle>
            {/* Only show tools for images for now, PDF has native viewer controls usually */}
            {!isPdf && (
              <div className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/5 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:bg-white/10 hover:text-white"
                  onClick={handleZoomOut}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center text-xs text-zinc-500 tabular-nums">
                  {Math.round(scale * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:bg-white/10 hover:text-white"
                  onClick={handleZoomIn}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <div className="mx-1 h-4 w-px bg-white/10" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-zinc-400 hover:bg-white/10 hover:text-white"
                  onClick={handleRotate}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 border-white/10 bg-transparent text-zinc-300 hover:bg-white/5 hover:text-white"
              asChild
            >
              <a href={url} download target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" />
                下载
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-zinc-400 hover:bg-white/10 hover:text-white"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden bg-zinc-900/50 p-4">
          {isPdf ? (
            <iframe
              src={url + '#toolbar=0'}
              className="h-full w-full rounded-md bg-white"
              title="PDF Preview"
            />
          ) : (
            <div
              className="relative origin-center transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              {/* Using standard img tag for better flexibility in this specific zoom context compared to Next.js Image with exact dims */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={fileName}
                className="max-h-[75vh] max-w-full rounded-sm object-contain shadow-2xl ring-1 ring-white/10"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
