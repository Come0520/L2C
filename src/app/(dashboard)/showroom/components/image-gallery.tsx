'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * 电商级图片画廊组件
 * 使用 framer-motion AnimatePresence 实现流畅切换
 * 支持：缩略图导航、全屏预览 (Lightbox)、移动端滑动手势
 */

// framer-motion 官方 slideshow 模式的滑动变体
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
    }),
};

// 滑动阈值
const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) =>
    Math.abs(offset) * velocity;

interface ImageGalleryProps {
    images: string[];
    alt?: string;
    className?: string;
}

export function ImageGallery({ images, alt = '商品图片', className }: ImageGalleryProps) {
    const [[page, direction], setPage] = useState([0, 0]);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    // 确保至少有一张占位图
    const safeImages = images.length > 0
        ? images
        : ['https://via.placeholder.com/800x600?text=No+Image'];

    // 循环索引
    const imageIndex = ((page % safeImages.length) + safeImages.length) % safeImages.length;

    const paginate = useCallback((newDirection: number) => {
        setPage(([prev]) => [prev + newDirection, newDirection]);
    }, []);

    const goToIndex = useCallback((index: number) => {
        setPage(([prev]) => [index, index > prev ? 1 : -1]);
    }, []);

    return (
        <div className={cn('space-y-3', className)}>
            {/* 主图区域 */}
            <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-muted">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.img
                        key={page}
                        src={safeImages[imageIndex]}
                        alt={`${alt} - ${imageIndex + 1}`}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 },
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={(_e, { offset, velocity }) => {
                            const swipe = swipePower(offset.x, velocity.x);
                            if (swipe < -swipeConfidenceThreshold) {
                                paginate(1);
                            } else if (swipe > swipeConfidenceThreshold) {
                                paginate(-1);
                            }
                        }}
                        className="absolute inset-0 h-full w-full cursor-grab object-cover active:cursor-grabbing"
                    />
                </AnimatePresence>

                {/* 左右切换按钮（桌面端 hover 显示） */}
                {safeImages.length > 1 && (
                    <>
                        <button
                            onClick={() => paginate(-1)}
                            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/50"
                            aria-label="上一张"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => paginate(1)}
                            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/50"
                            aria-label="下一张"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* 放大按钮 */}
                <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute right-3 bottom-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/50"
                    aria-label="全屏预览"
                >
                    <ZoomIn className="h-4 w-4" />
                </button>

                {/* 图片计数器（移动端始终显示） */}
                {safeImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-sm md:opacity-0 md:group-hover:opacity-100">
                        {imageIndex + 1} / {safeImages.length}
                    </div>
                )}
            </div>

            {/* 缩略图列表 */}
            {safeImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {safeImages.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => goToIndex(i)}
                            className={cn(
                                'relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200',
                                i === imageIndex
                                    ? 'border-primary ring-primary/20 ring-2'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                            )}
                        >
                            <img
                                src={img}
                                alt={`缩略图 ${i + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox 全屏预览 */}
            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="flex max-w-[95vw] items-center justify-center border-none bg-black/95 p-0 sm:max-w-[90vw]">
                    <div className="relative flex h-[85vh] w-full items-center justify-center">
                        {/* 关闭按钮 */}
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <AnimatePresence initial={false} custom={direction}>
                            <motion.img
                                key={page}
                                src={safeImages[imageIndex]}
                                alt={`${alt} - ${imageIndex + 1}`}
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: 'spring', stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 },
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(_e, { offset, velocity }) => {
                                    const swipe = swipePower(offset.x, velocity.x);
                                    if (swipe < -swipeConfidenceThreshold) {
                                        paginate(1);
                                    } else if (swipe > swipeConfidenceThreshold) {
                                        paginate(-1);
                                    }
                                }}
                                className="absolute max-h-full max-w-full cursor-grab object-contain active:cursor-grabbing"
                            />
                        </AnimatePresence>

                        {/* Lightbox 左右切换 */}
                        {safeImages.length > 1 && (
                            <>
                                <button
                                    onClick={() => paginate(-1)}
                                    className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    onClick={() => paginate(1)}
                                    className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}

                        {/* Lightbox 计数器 */}
                        {safeImages.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
                                {imageIndex + 1} / {safeImages.length}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
