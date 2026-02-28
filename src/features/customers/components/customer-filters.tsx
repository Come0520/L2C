'use client';

import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import Search from 'lucide-react/dist/esm/icons/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

export interface CustomerFilterValues {
  search?: string;
  level?: string;
}

interface CustomerFiltersProps {
  search?: string;
  level?: string;
  onSearch: (values: CustomerFilterValues) => void;
}

export function CustomerFilters({ search, level, onSearch }: CustomerFiltersProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const values = {
      search: formData.get('search') as string,
      level: formData.get('level') as string,
    };
    onSearch(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <div className="relative w-64">
        <Search className="absolute top-2.5 left-2 h-4 w-4 text-gray-500" />
        <Input name="search" placeholder="搜索客户..." defaultValue={search} className="pl-8" />
      </div>

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

      <Button type="submit" variant="secondary">
        筛选
      </Button>
    </form>
  );
}
