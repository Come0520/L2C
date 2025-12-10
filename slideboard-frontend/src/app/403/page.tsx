'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <DashboardLayout>
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        
        {/* 背景装饰：添加 aria-hidden 让读屏软件忽略 */}
        <div 
          aria-hidden="true" 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -z-10 pointer-events-none" 
        />

        <div className="text-center max-w-lg w-full animate-in fade-in zoom-in-95 duration-500 slide-in-from-bottom-8 delay-100">
          
          <div className="relative mb-8 inline-block">
            <div className="relative z-10 p-6 bg-theme-bg-secondary rounded-full shadow-xl border border-theme-border animate-float">
              {/* 图标作为装饰，也应 aria-hidden */}
              <ShieldAlert className="w-16 h-16 text-amber-500" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" aria-hidden="true" />
          </div>

          <h1 className="text-4xl font-extrabold text-theme-text-primary mb-3 tracking-tight">
            访问受限
          </h1>
          <h2 className="text-lg font-medium text-theme-text-secondary mb-4">
            抱歉，您当前的账号权限不足以查看此页面
          </h2>
          <p className="text-sm text-theme-text-secondary/80 mb-10 leading-relaxed max-w-sm mx-auto">
            这可能是一个私密区域，或者您的会话已过期。
            <br />
            如果您认为这是一个错误，请联系您的部门管理员。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <PaperButton
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto min-w-[140px] gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上一页
            </PaperButton>

            {/* ✅ 最佳实践：使用 Link 进行内部导航 */}
            <Link href="/" className="w-full sm:w-auto">
              <PaperButton
                as="div"
                variant="primary"
                className="w-full min-w-[140px] gap-2 shadow-lg hover:shadow-primary-500/25 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                回到首页
              </PaperButton>
            </Link>
          </div>
          
        </div>
      </div>
    </DashboardLayout>
  );
}
