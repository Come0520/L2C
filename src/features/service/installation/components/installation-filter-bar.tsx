'use client';

import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import Search from 'lucide-react/dist/esm/icons/search';
import SlidersHorizontal from 'lucide-react/dist/esm/icons/sliders-horizontal';

/**
 * 安装列表筛选条组件
 * 
 * 提供关键词搜索和高级筛选触发入口，通常位于表格上方。
 */
export function InstallationFilterBar() {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" placeholder="Search installation tasks..." />
            </div>
            <div className="flex gap-2">
                <Button variant="outline">
                    <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
                </Button>
                <Button>Search</Button>
            </div>
        </div>
    );
}
