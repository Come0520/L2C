'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';

const emptySubscribe = () => () => {};

export function ThemePreview() {
  const { theme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>预览</CardTitle>
          <CardDescription>当前主题: 加载中...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted h-[200px] animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>预览</CardTitle>
        <CardDescription>
          当前主题: {theme === 'light' ? '浅色模式' : theme === 'dark' ? '深色模式' : '跟随系统'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-background rounded-lg border p-4">
            <div className="font-medium">背景色</div>
            <div className="text-muted-foreground">Background</div>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <div className="font-medium">卡片色</div>
            <div className="text-muted-foreground">Card</div>
          </div>
          <div className="bg-primary text-primary-foreground rounded-lg border p-4">
            <div className="font-medium">主色调</div>
            <div className="opacity-80">Primary</div>
          </div>
          <div className="bg-muted rounded-lg border p-4">
            <div className="font-medium">次要色</div>
            <div className="text-muted-foreground">Muted</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
