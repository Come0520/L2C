'use client';

import { useState } from 'react';

import { useAuth } from '@/contexts/auth-context';

export function SocialLogin() {
  const { loginWithThirdParty } = useAuth();
  const [error, setError] = useState('');

  const handleThirdPartyLogin = async (provider: 'wechat' | 'feishu') => {
    setError('');
    try {
      await loginWithThirdParty(provider);
    } catch (err: any) {
      console.error('Third party login failed:', err);
      setError(`${provider === 'wechat' ? '微信' : '飞书'}登录失败`);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-center mb-4">
        <div className="flex-grow h-px bg-theme-border"></div>
        <span className="px-4 text-theme-text-secondary text-sm">或使用第三方登录</span>
        <div className="flex-grow h-px bg-theme-border"></div>
      </div>
      
      {error && (
        <div className="mb-4 text-center">
          <p className="text-error-600 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleThirdPartyLogin('wechat')}
          className="flex items-center gap-2 px-4 py-2 border border-theme-border rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21.35 9.17c0-3.65-4.22-6.63-9.43-6.63-5.2 0-9.43 2.98-9.43 6.63 0 2.21 1.54 4.18 3.94 5.45l-.99 3.01 3.65-1.92c.88.23 1.82.36 2.78.36.13 0 .25 0 .38 0-.1-.48-.15-.97-.15-1.46 0-4.04 3.79-7.31 8.46-7.31.26 0 .52.01.78.04zm-3.42 2.06c-3.94 0-7.13 2.81-7.13 6.27 0 1.95 1.08 3.68 2.76 4.83l-.63 2.29 2.78-1.39c.69.19 1.42.3 2.18.3 3.94 0 7.13-2.81 7.13-6.27 0-3.46-3.19-6.27-7.13-6.27z"></path>
          </svg>
          微信登录
        </button>
        <button
          onClick={() => handleThirdPartyLogin('feishu')}
          className="flex items-center gap-2 px-4 py-2 border border-theme-border rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.64 3.53a3.57 3.57 0 0 1 4.54-.5l8.77 6.42a1.68 1.68 0 0 1 .28 2.58l-5.6 6.78a3.56 3.56 0 0 1-5.1.4l-3.27-3.2a1.07 1.07 0 0 1-.22-1.18l2.25-6.65c.34-1 .4-1.63-1.65-3.66a1.07 1.07 0 0 0-.96-.28L1.6 6.2a1.07 1.07 0 0 1-.58-1.9L9.4 1.25a3.57 3.57 0 0 1 2.24-.72z"></path>
          </svg>
          飞书登录
        </button>
      </div>
    </div>
  );
}
