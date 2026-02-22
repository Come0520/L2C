'use client';

import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { useState } from "react";

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
    fileType
}: FilePreviewDialogProps) {
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);

    const isPdf = fileType === 'pdf' || url.toLowerCase().endsWith('.pdf');

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);

    const resetTransform = () => {
        setScale(1);
        setRotation(0);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetTransform();
            onOpenChange(val);
        }}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-950/90 border-zinc-800 backdrop-blur-xl">
                {/* Header Toolbar */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 z-50 bg-black/20">
                    <div className="flex items-center gap-4">
                        <DialogTitle className="text-zinc-100 font-medium tracking-tight">
                            {fileName}
                        </DialogTitle>
                        {/* Only show tools for images for now, PDF has native viewer controls usually */}
                        {!isPdf && (
                            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/5">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10" onClick={handleZoomOut}>
                                    <ZoomOut className="h-4 w-4" />
                                </Button>
                                <span className="text-xs text-zinc-500 w-12 text-center tabular-nums">
                                    {Math.round(scale * 100)}%
                                </span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10" onClick={handleZoomIn}>
                                    <ZoomIn className="h-4 w-4" />
                                </Button>
                                <div className="w-px h-4 bg-white/10 mx-1" />
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-white/10" onClick={handleRotate}>
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-transparent border-white/10 text-zinc-300 hover:text-white hover:bg-white/5" asChild>
                            <a href={url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-3.5 w-3.5" />
                                下载
                            </a>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative w-full h-full bg-zinc-900/50 flex items-center justify-center p-4">
                    {isPdf ? (
                        <iframe
                            src={url + '#toolbar=0'}
                            className="w-full h-full rounded-md bg-white"
                            title="PDF Preview"
                        />
                    ) : (
                        <div
                            className="relative transition-transform duration-200 ease-out origin-center"
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
                                className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-sm ring-1 ring-white/10"
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
