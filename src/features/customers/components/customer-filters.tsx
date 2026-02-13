'use client';

import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import Search from 'lucide-react/dist/esm/icons/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface CustomerFiltersProps {
    search?: string;
    type?: string;
    level?: string;
    onSearch: (values: any) => void;
}

export function CustomerFilters({ search, type, level, onSearch }: CustomerFiltersProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const values = {
            search: formData.get('search') as string,
            type: formData.get('type') as string,
            level: formData.get('level') as string,
        };
        onSearch(values);
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center flex-wrap">
            <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                    name="search"
                    placeholder="搜索客户..."
                    defaultValue={search}
                    className="pl-8"
                />
            </div>

            <Select name="type" defaultValue={type || 'ALL'}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="客户类型" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">全部类型</SelectItem>
                    <SelectItem value="INDIVIDUAL">个人</SelectItem>
                    <SelectItem value="COMPANY">公司</SelectItem>
                    <SelectItem value="DESIGNER">设计师</SelectItem>
                    <SelectItem value="PARTNER">合作伙伴</SelectItem>
                </SelectContent>
            </Select>

            <Select name="level" defaultValue={level || 'ALL'}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="客户等级" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">全部等级</SelectItem>
                    <SelectItem value="A">A级 (VIP)</SelectItem>
                    <SelectItem value="B">B级 (核心)</SelectItem>
                    <SelectItem value="C">C级 (重要)</SelectItem>
                    <SelectItem value="D">D级 (普通)</SelectItem>
                </SelectContent>
            </Select>

            <Button type="submit" variant="secondary">筛选</Button>
        </form>
    );
}
