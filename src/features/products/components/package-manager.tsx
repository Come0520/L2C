'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getPackages,
    deletePackage,
    togglePackageStatus
} from '../actions/package-actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Search from 'lucide-react/dist/esm/icons/search';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Power from 'lucide-react/dist/esm/icons/power';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { PackageFormDialog, ProductPackage } from './package-form-dialog';
import { format } from 'date-fns';


export function PackageManager() {
    const [packages, setPackages] = useState<ProductPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<ProductPackage | null>(null);


    const loadPackages = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getPackages();
            if (result.success) {
                setPackages((result.data || []) as ProductPackage[]);
            } else {
                toast.error(result.error || '获取套餐列表失败');
            }
        } catch (error) {
            console.error(error);
            toast.error('获取套餐列表失败');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPackages();
    }, [loadPackages]);

    const handleCreate = () => {
        setEditingPackage(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (pkg: ProductPackage) => {
        setEditingPackage(pkg);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该套餐吗？相关商品关联也将被移除。')) return;

        try {
            const result = await deletePackage(id);
            if (result.success) {
                toast.success('删除成功');
                loadPackages();
            } else {
                toast.error(result.error || '删除失败');
            }
        } catch (error) {
            console.error(error);
            toast.error('删除失败');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const result = await togglePackageStatus(id, !currentStatus);
            if (result.success) {
                toast.success(currentStatus ? '已禁用' : '已启用');
                loadPackages();
            } else {
                toast.error(result.error || '操作失败');
            }
        } catch (error) {
            console.error(error);
            toast.error('操作失败');
        }
    };

    const filteredPackages = packages.filter(pkg =>
        pkg.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.packageNo.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getPackageTypeLabel = (type: string) => {
        switch (type) {
            case 'QUANTITY': return '数量套餐';
            case 'COMBO': return '组合套餐';
            case 'CATEGORY': return '品类套餐';
            case 'TIME_LIMITED': return '限时套餐';
            default: return type;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="搜索套餐名称或编号..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> 新增套餐
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium">套餐列表</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            暂无套餐数据
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>编号</TableHead>
                                    <TableHead>名称</TableHead>
                                    <TableHead>类型</TableHead>
                                    <TableHead>套餐价格</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>有效期</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPackages.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="font-medium">{pkg.packageNo}</TableCell>
                                        <TableCell>{pkg.packageName}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {getPackageTypeLabel(pkg.packageType)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">
                                            ¥{parseFloat(String(pkg.packagePrice)).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={pkg.isActive ? "success" : "secondary"}>
                                                {pkg.isActive ? '启用中' : '已禁用'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {pkg.startDate && pkg.endDate ? (
                                                <>
                                                    {format(new Date(pkg.startDate), 'yyyy/MM/dd')}
                                                    -
                                                    {format(new Date(pkg.endDate), 'yyyy/MM/dd')}
                                                </>
                                            ) : '永久有效'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(pkg)}>
                                                        <Edit className="mr-2 h-4 w-4" /> 编辑
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(pkg.id, !!pkg.isActive)}>
                                                        <Power className="mr-2 h-4 w-4" />
                                                        {pkg.isActive ? '禁用' : '启用'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-500"
                                                        onClick={() => handleDelete(pkg.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> 删除
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <PackageFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                // @ts-expect-error - Package inferred types slightly differ
                editingData={editingPackage || undefined}
                onSuccess={loadPackages}
            />
        </div>
    );
}
