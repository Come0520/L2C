'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Scroll from 'lucide-react/dist/esm/icons/scroll';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Heart from 'lucide-react/dist/esm/icons/heart';
import { useStyle, type VisualStyle } from '@/shared/providers/style-provider';
import { Separator } from '@/shared/ui/separator';

const emptySubscribe = () => () => {};

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const { style, setStyle } = useStyle();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>界面外观</CardTitle>
          <CardDescription>自定义您的系统视觉体验</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>外观模式</Label>
            <div className="grid h-[80px] animate-pulse grid-cols-3 gap-4">
              <div className="bg-muted col-span-1 rounded-md" />
              <div className="bg-muted col-span-1 rounded-md" />
              <div className="bg-muted col-span-1 rounded-md" />
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <Label>设计风格</Label>
            <div className="grid h-[80px] animate-pulse grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-muted col-span-1 rounded-md" />
              <div className="bg-muted col-span-1 rounded-md" />
              <div className="bg-muted col-span-1 rounded-md" />
              <div className="bg-muted col-span-1 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>界面外观</CardTitle>
        <CardDescription>自定义您的系统视觉体验，消除“两套系统”的不一致感</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* 1. 深浅模式 */}
        <div className="space-y-4">
          <Label className="text-base">外观模式</Label>
          <RadioGroup
            value={theme}
            onValueChange={setTheme}
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {[
              { value: 'light', label: '浅色模式', icon: Sun },
              { value: 'dark', label: '深色模式', icon: Moon },
              { value: 'system', label: '跟随系统', icon: Monitor },
            ].map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={`theme-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`theme-${option.value}`}
                  className="border-muted bg-popover/50 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all"
                >
                  <option.icon className="mb-3 h-6 w-6" />
                  <span className="text-sm font-medium">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <Separator className="bg-white/10 dark:bg-white/5" />

        {/* 2. 设计风格 */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <Label className="text-base">设计风格 (Design System)</Label>
            <p className="text-muted-foreground text-xs">
              切换不同的视觉体系，解决界面风格不统一的问题
            </p>
          </div>
          <RadioGroup
            value={style}
            onValueChange={(v) => setStyle(v as VisualStyle)}
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            {[
              { value: 'glass', label: '水晶玻璃', icon: Sparkles, desc: '沉浸式透明感' },
              { value: 'parchment', label: '羊皮卷轴', icon: Scroll, desc: '典雅古风护眼' },
              { value: 'clay', label: '软陶拟物', icon: Palette, desc: '温馨柔和圆润' },
              { value: 'cute', label: '马卡龙色', icon: Heart, desc: '活泼明亮可爱' },
            ].map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={`style-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`style-${option.value}`}
                  className="border-muted bg-popover/50 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all"
                >
                  <option.icon className="mb-2 h-6 w-6" />
                  <span className="text-sm font-bold">{option.label}</span>
                  <span className="text-muted-foreground mt-1 text-[10px] leading-tight opacity-70">
                    {option.desc}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
