'use client';

import React, { useState } from 'react';
import { SidebarProvider } from '@/shared/ui/sidebar';

/**
 * 移动端侧边栏状态提升包装器（Client Component）
 *
 * 将 SidebarProvider 提升到 layout 层，使 MobileSidebar 和 Header 能共享同一个
 * SidebarContext，从而支持 Header 中的汉堡菜单按钮控制移动端侧边栏开关。
 *
 * 注意：DesktopSidebar 使用独立的 hoverOpen 状态（通过嵌套 SidebarProvider），
 * 不再共享此全局 open 状态，因此此处无需 localStorage 持久化。
 */
export function SidebarProviderWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={true}>
      {children}
    </SidebarProvider>
  );
}
