'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { createClient } from '@/lib/supabase/client';

const OAuthCallbackPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient();
        
        // 获取URL中的auth_code
        const code = searchParams.get('code');
        const oauthError = searchParams.get('error');

        if (oauthError) {
          throw new Error(oauthError);
        }

        if (code) {
          // 交换auth_code获取session
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionError) {
            throw sessionError;
          }

          // 重定向到首页
          router.replace('/');
        } else {
          throw new Error('缺少授权码');
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        setError(message || '登录失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-paper-200 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-success-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-paper-lg">
          <span className="text-white font-bold text-xl">L2C</span>
        </div>
        <h1 className="text-2xl font-semibold text-ink-800 mb-2">登录中...</h1>
        
        {isLoading ? (
          <div className="mt-6">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-success-600 mb-4"></div>
            <p className="text-ink-600">正在处理登录，请稍候...</p>
          </div>
        ) : error ? (
          <div className="mt-6">
            <div className="text-error-500 mb-4">❌</div>
            <h2 className="text-xl font-semibold text-error-600 mb-2">登录失败</h2>
            <p className="text-ink-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-success-600 text-white px-6 py-2 rounded-lg hover:bg-success-700 transition-colors"
            >
              返回登录页
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <div className="text-success-500 mb-4">✅</div>
            <h2 className="text-xl font-semibold text-success-600 mb-2">登录成功</h2>
            <p className="text-ink-600 mb-6">正在跳转到首页...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
