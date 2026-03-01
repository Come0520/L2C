'use client';

import React from 'react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import Search from 'lucide-react/dist/esm/icons/search';

export function QuotesFilterBar() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input placeholder="搜索报价单..." className="pl-8" />
      </div>
      <Button variant="outline">筛选 (Filter)</Button>
    </div>
  );
}
