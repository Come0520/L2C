'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface Photo {
    id: string;
    photoType: 'BEFORE' | 'AFTER' | 'DETAIL';
    photoUrl: string;
    remark?: string | null;
    createdAt: Date | null;
}

interface InstallPhotoGalleryProps {
    photos: Photo[];
    allowUpload: boolean;
}

const PHOTO_TYPE_MAP = {
    BEFORE: '施工前',
    AFTER: '施工后',
    DETAIL: '细节图',
};

export function InstallPhotoGallery({ photos, allowUpload: _allowUpload }: InstallPhotoGalleryProps) {
    const renderPhotoSection = (type: keyof typeof PHOTO_TYPE_MAP) => {
        const filteredPhotos = photos.filter(p => p.photoType === type);

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                        {PHOTO_TYPE_MAP[type]}
                        <span className="text-muted-foreground text-xs font-normal">({filteredPhotos.length})</span>
                    </h4>
                    {/* Add Upload Button Here if allowUpload */}
                </div>

                {filteredPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredPhotos.map(photo => (
                            <div key={photo.id} className="group relative aspect-square rounded-md overflow-hidden bg-secondary/20 border">
                                <Image
                                    src={photo.photoUrl}
                                    alt={photo.remark || type}
                                    fill
                                    className="object-cover transition-transform hover:scale-105"
                                />
                                {photo.remark && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                        {photo.remark}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-20 flex items-center justify-center border border-dashed rounded bg-secondary/10 text-muted-foreground text-sm">
                        暂无照片
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    现场照片
                </CardTitle>
                <CardDescription>
                    共 {photos.length} 张照片
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {renderPhotoSection('BEFORE')}
                {renderPhotoSection('AFTER')}
                {renderPhotoSection('DETAIL')}
            </CardContent>
        </Card>
    );
}
