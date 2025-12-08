'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { env } from '@/config/env';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 错误图标 */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-16 w-16 text-red-600" />
          </div>
        </div>

        {/* 错误信息 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">出错了</h1>
          <p className="text-gray-600 mb-2">
            抱歉，出现了一些问题。
          </p>
          <p className="text-sm text-gray-500">
            错误代码: {error.digest || '未知错误'}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            重试
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            返回首页
          </Link>
        </div>

        {/* 错误详情（开发环境） */}
        {env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="text-sm font-medium text-gray-900 mb-2">错误详情</h3>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32">
              {error.message}
              {error.stack && `\n${error.stack}`}
            </pre>
          </div>
        )}

        {/* 帮助链接 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">如果问题持续存在，您可以：</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            
            <Link
              href="/login"
              className="text-red-600 hover:text-red-700 underline"
            >
              重新登录
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="text-red-600 hover:text-red-700 underline"
            >
              刷新页面
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
