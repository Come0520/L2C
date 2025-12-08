import Link from 'next/link';

import DashboardLayout from '@/components/layout/dashboard-layout';

/**
 * 403 无权限页面
 */
export default function ForbiddenPage() {
  return (
    <DashboardLayout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-9xl mb-6">🚫</div>
          <h1 className="text-4xl font-bold text-paper-ink mb-4">403</h1>
          <h2 className="text-2xl font-semibold text-paper-ink mb-4">无权访问</h2>
          <p className="text-paper-ink-secondary mb-8">
            您没有权限访问此页面。如需访问,请联系管理员。
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-paper-primary text-white rounded-lg hover:bg-paper-primary-dark transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
