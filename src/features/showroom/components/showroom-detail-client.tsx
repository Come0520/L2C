'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Share2, Heart, Download, ShoppingCart, Eye, Calendar, User, Star, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ImageGallery } from './image-gallery';
import { createShareLink } from '@/features/showroom/actions';
import { toast } from 'sonner';
import { useTransition } from 'react';

/**
 * 展厅详情页 - 客户端组件
 * 根据类型自动切换布局：
 * - PRODUCT: 电商模式（左图右文 → 移动端上下堆叠）
 * - CASE/KNOWLEDGE/TRAINING: 沉浸式文章模式
 */

// 类型配色与标签映射
const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    PRODUCT: { label: '商品', emoji: '🏷️', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
    CASE: { label: '案例', emoji: '🏠', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
    KNOWLEDGE: { label: '知识', emoji: '📖', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
    TRAINING: { label: '培训', emoji: '📋', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
};

interface ShowroomDetailItem {
    id: string;
    title: string;
    type: 'PRODUCT' | 'CASE' | 'KNOWLEDGE' | 'TRAINING';
    content?: string | null;
    images: unknown;
    tags: unknown;
    score: number | null;
    status: string;
    views: number | null;
    shares: number | null;
    createdAt: Date | string | null;
    product?: {
        id: string;
        name: string;
        unitPrice?: string | null;
        unit?: string | null;
    } | null;
    creator?: {
        id: string;
        name?: string | null;
    } | null;
}

// ========== 动画配置 ==========
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
};

const stagger = {
    animate: { transition: { staggerChildren: 0.1 } },
};

// ========== 公共组件 ==========

/** 面包屑导航 */
function Breadcrumb({ type, title }: { type: string; title: string }) {
    const typeInfo = TYPE_CONFIG[type] || { label: type, emoji: '📄' };
    return (
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/showroom" className="transition-colors hover:text-foreground">
                云展厅
            </Link>
            <span>/</span>
            <span>{typeInfo.label}</span>
            <span>/</span>
            <span className="truncate text-foreground font-medium max-w-[200px]">{title}</span>
        </nav>
    );
}

/** 元信息栏 */
function MetaInfo({ item, createdDate }: { item: ShowroomDetailItem; createdDate: string | null }) {
    return (
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
            {item.creator?.name && (
                <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {item.creator.name}
                </span>
            )}
            {createdDate && (
                <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {createdDate}
                </span>
            )}
            {item.views != null && (
                <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {item.views} 次浏览
                </span>
            )}
        </div>
    );
}

/** Markdown 内容渲染 */
function MarkdownContent({ content }: { content: string }) {
    return (
        <div className="prose dark:prose-invert prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-img:rounded-xl prose-table:border prose-th:bg-muted/50 prose-th:p-2 prose-td:p-2 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
}

// ========== 商品布局 (Product Layout) ==========

function ProductLayout({ item, images, tags, typeInfo, createdDate, onShare, isSharing }: {
    item: ShowroomDetailItem;
    images: string[];
    tags: string[];
    typeInfo: { label: string; emoji: string; color: string };
    createdDate: string | null;
    onShare: () => void;
    isSharing: boolean;
}) {
    return (
        <motion.div className="min-h-screen bg-background" {...stagger} initial="initial" animate="animate">
            {/* 顶部导航 */}
            <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="container mx-auto flex items-center gap-4 px-4 py-3 md:px-6">
                    <Link href="/showroom">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Breadcrumb type={item.type} title={item.title} />
                </div>
            </div>

            {/* 主体内容 */}
            <div className="container mx-auto px-4 py-6 md:px-6 md:py-10">
                {/* 商品概览区：移动端上下堆叠，桌面端左右分栏 */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10 lg:gap-14">
                    {/* 左侧：图片画廊 */}
                    <motion.div {...fadeInUp}>
                        <ImageGallery images={images} alt={item.title} />
                    </motion.div>

                    {/* 右侧：商品信息 - 移动端紧凑，桌面端 sticky */}
                    <motion.div {...fadeInUp} className="space-y-6 md:sticky md:top-20 md:self-start">
                        {/* 类型标签 + Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className={typeInfo.color}>
                                {typeInfo.emoji} {typeInfo.label}
                            </Badge>
                            {tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-muted-foreground">
                                    {tag}
                                </Badge>
                            ))}
                        </div>

                        {/* 标题 */}
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                            {item.title}
                        </h1>

                        {/* 评分 (如果有) */}
                        {item.score != null && item.score > 0 && (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < Math.round((item.score ?? 0) / 20)
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-muted-foreground/30'
                                                }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    完整度 {item.score}%
                                </span>
                            </div>
                        )}

                        {/* 价格区 - 电商核心 */}
                        {item.product?.unitPrice && (
                            <div className="rounded-xl bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 border border-amber-200/50 dark:border-amber-800/30">
                                <span className="text-xs text-muted-foreground block mb-1">参考价格</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm text-amber-600 dark:text-amber-400">¥</span>
                                    <span className="font-mono text-3xl font-bold text-amber-600 dark:text-amber-400">
                                        {item.product.unitPrice}
                                    </span>
                                    {item.product.unit && (
                                        <span className="text-sm text-muted-foreground">/{item.product.unit}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 关联商品 */}
                        {item.product && (
                            <div className="space-y-3 rounded-xl border border-border/60 p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">关联商品</span>
                                    <span className="font-medium">{item.product.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">分享次数</span>
                                    <span className="font-medium">{item.shares ?? 0} 次</span>
                                </div>
                            </div>
                        )}

                        {/* 元信息 */}
                        <MetaInfo item={item} createdDate={createdDate} />

                        {/* CTA 按钮组 */}
                        <div className="space-y-3 pt-2">
                            <Button
                                size="lg"
                                className="w-full rounded-xl shadow-lg shadow-primary/20"
                                onClick={onShare}
                                disabled={isSharing}
                            >
                                {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                                分享给客户
                            </Button>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="rounded-xl" disabled title="功能开发中">
                                    <Download className="mr-2 h-4 w-4" /> 下载大图
                                </Button>
                                <Button variant="outline" className="rounded-xl" disabled title="功能开发中">
                                    <ShoppingCart className="mr-2 h-4 w-4" /> 加入选品
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" disabled title="功能开发中">
                                <Heart className="mr-2 h-4 w-4" /> 收藏
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* 商品详情区 - 全宽 Markdown */}
                {item.content && (
                    <motion.div
                        {...fadeInUp}
                        className="mt-10 md:mt-16 border-t border-border/50 pt-8"
                    >
                        <h2 className="mb-6 text-xl font-bold flex items-center gap-2">
                            <ExternalLink className="h-5 w-5 text-primary" />
                            商品详情
                        </h2>
                        <MarkdownContent content={item.content} />
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

// ========== 文章布局 (Article Layout) ==========

function ArticleLayout({ item, images, tags, typeInfo, createdDate, onShare, isSharing }: {
    item: ShowroomDetailItem;
    images: string[];
    tags: string[];
    typeInfo: { label: string; emoji: string; color: string };
    createdDate: string | null;
    onShare: () => void;
    isSharing: boolean;
}) {
    const coverImage = images[0] || '/images/placeholder-showroom.jpg';
    const isTraining = item.type === 'TRAINING';

    return (
        <div className="bg-background relative min-h-screen pb-20 md:pb-0">
            {/* Hero 图片 - 移动端更高 */}
            <div className="relative h-[35vh] w-full overflow-hidden sm:h-[40vh] md:h-[50vh]">
                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.8 }}
                    src={coverImage}
                    alt={item.title}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />

                {/* 返回按钮 */}
                <div className="absolute top-4 left-4 z-20">
                    <Link href="/showroom">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full border-none bg-black/20 text-white backdrop-blur-md hover:bg-black/40"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* Hero 上的标题/元信息（沉浸式） */}
                <div className="absolute inset-0 flex items-end p-4 sm:p-6 md:p-12">
                    <div className="max-w-3xl space-y-2 text-white">
                        <Badge className="bg-primary/80 mb-2 border-none backdrop-blur-sm">
                            {typeInfo.emoji} {typeInfo.label}
                        </Badge>
                        <h1 className="text-2xl leading-tight font-bold sm:text-3xl md:text-5xl">
                            {item.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-xs opacity-90 sm:text-sm">
                            {item.creator?.name && (
                                <span className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" />
                                    {item.creator.name}
                                </span>
                            )}
                            {createdDate && (
                                <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {createdDate}
                                    </span>
                                </>
                            )}
                            {item.views != null && (
                                <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" />
                                        {item.views} 次浏览
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 主内容区 - 卡片上浮 */}
            <div className="bg-background relative z-10 -mt-6 min-h-[50vh] rounded-t-3xl border-t border-border/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] sm:-mt-10 md:-mt-20">
                <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 md:p-12">
                    {/* 培训类型特殊提示 */}
                    {isTraining && (
                        <motion.div
                            {...fadeInUp}
                            className="mb-6 rounded-xl border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-300"
                        >
                            📋 内部培训资料 — 仅限内部使用，请勿外传
                        </motion.div>
                    )}

                    {/* Markdown 内容 */}
                    {item.content && (
                        <motion.div {...fadeInUp}>
                            <MarkdownContent content={item.content} />
                        </motion.div>
                    )}

                    {/* 图集 - 多图展示 */}
                    {images.length > 1 && (
                        <motion.div {...fadeInUp} className="mt-8 space-y-4">
                            <h3 className="text-xl font-semibold opacity-90">图集</h3>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                {images.slice(1).map((img, i) => (
                                    <motion.img
                                        key={i}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        src={img}
                                        alt={`${item.title} - 图片 ${i + 2}`}
                                        className="h-36 w-full cursor-pointer rounded-xl object-cover transition-transform duration-500 hover:scale-105 sm:h-48"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 标签 */}
                    {tags.length > 0 && (
                        <motion.div {...fadeInUp} className="mt-8 flex flex-wrap gap-2 border-t border-border/50 pt-6">
                            {tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-muted-foreground">
                                    {tag}
                                </Badge>
                            ))}
                        </motion.div>
                    )}

                    {/* 底部操作栏 (移动端固定在底部, 桌面端内联) */}
                    <motion.div
                        {...fadeInUp}
                        className="mt-8 flex items-center gap-3 border-t border-border/50 pt-6"
                    >
                        <Button
                            size="lg"
                            className="flex-1 rounded-xl shadow-lg shadow-primary/20 md:flex-none"
                            onClick={onShare}
                            disabled={isSharing}
                        >
                            {isSharing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                            分享给客户
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full" disabled title="功能开发中">
                            <Heart className="h-5 w-5" />
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* 移动端底部安全区域 */}
            <div className="h-safe-area-inset-bottom md:hidden" />
        </div>
    );
}

// ========== 主入口组件 ==========

/**
 * 展厅素材详情客户端组件
 * 核心职责：
 * 1. 负责顶级页面布局框架
 * 2. 处理分享回调逻辑
 * 3. 根据资源类型分配具体布局渲染
 * 
 * @param props { item: ShowroomDetailItem } 素材详细数据对象
 */
export function ShowroomDetailClient({ item }: { item: ShowroomDetailItem }) {
    const images = Array.isArray(item.images) ? (item.images as string[]) : [];
    const tags = Array.isArray(item.tags) ? (item.tags as string[]) : [];
    const typeInfo = TYPE_CONFIG[item.type] || { label: item.type, emoji: '📄', color: 'bg-gray-500/10 text-gray-700' };
    const [isPending, startTransition] = useTransition();

    const createdDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    const handleShare = () => {
        startTransition(async () => {
            try {
                const result = await createShareLink({
                    items: [{ itemId: item.id }],
                    expiresInDays: 30, // 默认 30 天
                });
                if (result.url) {
                    await navigator.clipboard.writeText(result.url);
                    toast.success('分享链接已复制到剪贴板');
                }
            } catch (error) {
                console.error('Share error:', error);
                toast.error('创建分享链接失败，请重试');
            }
        });
    };

    // 商品类型使用电商布局，其他使用文章布局
    if (item.type === 'PRODUCT') {
        return (
            <ProductLayout
                item={item}
                images={images}
                tags={tags}
                typeInfo={typeInfo}
                createdDate={createdDate}
                onShare={handleShare}
                isSharing={isPending}
            />
        );
    }

    return (
        <ArticleLayout
            item={item}
            images={images}
            tags={tags}
            typeInfo={typeInfo}
            createdDate={createdDate}
            onShare={handleShare}
            isSharing={isPending}
        />
    );
}
