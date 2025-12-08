"use client";

import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 图标 */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-primary-100 rounded-full flex items-center justify-center">
            <div className="text-6xl font-bold text-primary-600">404</div>
          </div>
        </div>

        {/* 错误信息 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">页面未找到</h1>
          <p className="text-gray-600 mb-2">
            抱歉，您访问的页面不存在或已被移除。
          </p>
          <p className="text-sm text-gray-500">
            请检查网址是否正确，或返回首页继续浏览。
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            返回首页
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            返回上一页
          </button>
        </div>

        {/* 帮助链接 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">您还可以尝试：</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/login"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              登录账户
            </Link>
            <Link
              href="/register"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              注册新账户
            </Link>
            <Link
              href="/help"
              className="text-primary-600 hover:text-primary-700 underline"
            >
              帮助中心
            </Link>
          </div>
        </div>

        {/* 搜索建议 */}
        <div className="mt-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const searchTerm = (e.target as HTMLFormElement).search.value;
              window.location.href = `/?search=${encodeURIComponent(searchTerm)}`;
            }}
            className="flex max-w-sm mx-auto"
          >
            <input
              type="text"
              name="search"
              placeholder="搜索幻灯片..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              type="submit"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              搜索
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
