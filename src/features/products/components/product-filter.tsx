import { logger } from "@/shared/lib/logger";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';
import { CATEGORY_GROUPS, CATEGORY_LABELS } from '@/features/quotes/constants';
import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';
import { Input } from '@/shared/ui/input';
import { useState } from 'react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface ProductFilterProps {
  category: string;
  onCategoryChange: (value: string) => void;
}

export function ProductFilter({ category, onCategoryChange }: ProductFilterProps) {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  return (
    <Card className="bg-card/50 sticky top-4 h-fit overflow-hidden rounded-lg border backdrop-blur-sm">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <span className="text-primary">☷</span> 筛选
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-4">
        {/* Categories */}
        <div className="space-y-3">
          <h4 className="text-muted-foreground ml-1 text-xs font-semibold tracking-wider uppercase">
            产品品类
          </h4>
          <div className="flex flex-col gap-1">
            <Button
              variant={category === 'ALL' ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start text-sm font-normal"
              onClick={() => onCategoryChange('ALL')}
            >
              全部
            </Button>

            <Accordion
              type="multiple"
              className="w-full"
              // Auto expand group if category matches
              defaultValue={CATEGORY_GROUPS.filter((g) => g.categories.includes(category)).map(
                (g) => g.value
              )}
            >
              {CATEGORY_GROUPS.map((group) => (
                <AccordionItem key={group.value} value={group.value} className="border-b-0">
                  <AccordionTrigger className="hover:bg-muted/50 rounded-md px-2 py-2 text-sm hover:no-underline">
                    {group.label}
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-2 pl-2">
                    <div className="flex flex-col gap-1 border-l pl-2">
                      {group.categories.map((cat) => (
                        <Button
                          key={cat}
                          variant={category === cat ? 'secondary' : 'ghost'}
                          size="sm"
                          className="h-7 w-full justify-start text-sm font-normal"
                          onClick={() => onCategoryChange(cat)}
                        >
                          {CATEGORY_LABELS[cat] || cat}
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-4">
          <h4 className="text-muted-foreground text-sm font-medium">价格区间 (演示)</h4>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="最低价"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="h-8"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="最高价"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="h-8"
            />
          </div>
        </div>

        <Separator />

        {/* Status (Mock UI) */}
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-sm font-medium">状态 (演示)</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="status-active" defaultChecked />
              <label
                htmlFor="status-active"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                上架中
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="status-inactive" />
              <label
                htmlFor="status-inactive"
                className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                已下架
              </label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
