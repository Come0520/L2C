'use client';

import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface FilterBarProps {
  onSearch: (query: string) => void;
}

export function FilterBar({ onSearch }: FilterBarProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/20 bg-white/50 p-2 shadow-sm backdrop-blur-sm transition-all duration-300 focus-within:bg-white/80 focus-within:shadow-md dark:bg-black/20 dark:focus-within:bg-black/40">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="搜索商品 / 案例..."
          className="h-10 w-full border-none bg-transparent pl-9 shadow-none focus-visible:ring-0"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-primary/10 hover:text-primary rounded-xl"
      >
        <SlidersHorizontal className="h-5 w-5" />
      </Button>
      <Button className="from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 shadow-gold-500/20 rounded-xl border-0 bg-gradient-to-r px-6 text-white shadow-lg">
        选择
      </Button>
    </div>
  );
}
