import { SupplyChainTabNav } from '@/features/supply-chain/components/supply-chain-tab-nav';

/**
 * 供应链模块布局
 * 采用顶部Tabs导航 + 内容区域的布局模式
 */
export default function SupplyChainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* 顶部Tab导航 */}
      <div className="shrink-0 px-6 pt-4 pb-2">
        <SupplyChainTabNav />
      </div>
      {/* 内容区域 */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl px-6 pt-2 pb-8">{children}</div>
      </main>
    </div>
  );
}
