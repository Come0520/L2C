'use client';

import React, { useState } from 'react';
import { SidebarProvider } from '@/shared/ui/sidebar';

/**
 * 移动端侧边栏状态提升包装器（Client Component）
 *
 * 将 SidebarProvider 提升到 layout 层，使 AppSidebar 和 Header 能共享同一个
 * SidebarContext，从而支持 Header 中的汉堡菜单按钮控制侧边栏开关。
 *
 * 背景：AppSidebar 内部的 <Sidebar> 自带 SidebarProvider，但 Header 是其兄弟节点，
 * 无法访问 AppSidebar 内部的 context。通过将 Provider 提升至 layout 层解决此问题，
 * 同时 AppSidebar 中的 <Sidebar> 改为不带 Provider（open/setOpen 由外部注入）。
 */
export function SidebarProviderWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={true}>
      {children}
    </SidebarProvider>
  );
}
