'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import {
    Layout,
    Search,
    Tag,
    Clock,
    User,
    Trash2,
    Copy,
    Users,
    Lock,
    LayoutGrid,
    List
} from 'lucide-react';
import { deleteQuoteTemplate } from '../actions/template-actions';
import { toast } from 'sonner';

interface QuoteTemplate {
    id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    tags?: string[] | null;
    isPublic?: boolean | null;
    itemCount: number;
    roomCount: number;
    createdAt: Date | null;
    creator?: {
        id: string;
        name: string | null;
    } | null;
}

interface QuoteTemplateListProps {
    templates: QuoteTemplate[];
    categories: string[];
}

/**
 * 报价模板列表组件
 * 支持搜索、筛选、删除和使用模板
 */
export function QuoteTemplateList({ templates, categories }: QuoteTemplateListProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 筛选模板
    const filteredTemplates = templates.filter(template => {
        const searchMatch = search === '' ||
            template.name.toLowerCase().includes(search.toLowerCase()) ||
            template.description?.toLowerCase().includes(search.toLowerCase());

        const categoryMatch = categoryFilter === 'all' || template.category === categoryFilter;

        return searchMatch && categoryMatch;
    });

    const handleDelete = async () => {
        if (!deleteId) return;

        setIsDeleting(true);
        try {
            const res = await deleteQuoteTemplate({ templateId: deleteId });
            if (res?.data?.success) {
                toast.success('模板已删除');
                router.refresh();
            } else {
                toast.error('删除失败');
            }
        } catch (e) {
            console.error('[DeleteTemplateError]', e);
            toast.error('系统异常');
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    const getCategoryLabel = (category?: string | null) => {
        const labels: Record<string, string> = {
            CURTAIN: '窗帘',
            WALLPAPER: '墙纸墙布',
            MIXED: '综合',
        };
        return labels[category || ''] || category || '未分类';
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-4">
            {/* 工具栏 */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="搜索模板..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="分类" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部分类</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>
                                    {getCategoryLabel(cat)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-1">
                    <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* 模板列表 */}
            {filteredTemplates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">
                            {search || categoryFilter !== 'all'
                                ? '没有找到匹配的模板'
                                : '暂无模板，在报价详情页点击「保存为模板」创建'}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <Card
                            key={template.id}
                            className="group hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1 min-w-0">
                                        <CardTitle className="text-base truncate">
                                            {template.name}
                                        </CardTitle>
                                        {template.description && (
                                            <CardDescription className="line-clamp-2">
                                                {template.description}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 ml-2" title={template.isPublic ? '团队共享' : '私有'}>
                                        {template.isPublic ? (
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <Lock className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* 标签 */}
                                <div className="flex flex-wrap gap-1">
                                    <Badge variant="outline" className="text-xs">
                                        {getCategoryLabel(template.category)}
                                    </Badge>
                                    {template.tags?.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                            <Tag className="h-3 w-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>

                                {/* 统计 */}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{template.roomCount} 个空间</span>
                                    <span>{template.itemCount} 个商品</span>
                                </div>

                                {/* 元信息 */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {template.creator?.name || '未知'}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDate(template.createdAt)}
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            // TODO: 跳转到选择客户页面或直接创建报价
                                            toast.info('请先选择客户后使用模板创建报价');
                                        }}
                                    >
                                        <Copy className="h-3 w-3 mr-1" />
                                        使用模板
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteId(template.id);
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredTemplates.map(template => (
                        <Card key={template.id} className="group hover:shadow-sm transition-shadow">
                            <CardContent className="py-3 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <Layout className="h-8 w-8 text-muted-foreground shrink-0" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium truncate">{template.name}</span>
                                            <Badge variant="outline" className="text-xs shrink-0">
                                                {getCategoryLabel(template.category)}
                                            </Badge>
                                            {template.isPublic && (
                                                <Users className="h-3 w-3 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {template.roomCount} 空间 · {template.itemCount} 商品 · {template.creator?.name}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline">
                                        <Copy className="h-3 w-3 mr-1" />
                                        使用
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setDeleteId(template.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* 删除确认对话框 */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确认删除模板？</AlertDialogTitle>
                        <AlertDialogDescription>
                            删除后无法恢复，已使用此模板创建的报价不受影响。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? '删除中...' : '确认删除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
