'use client';

import { useState } from 'react';

import { FeishuQRLogin } from './feishu-qr-login';

export function SocialLogin() {
  const [error, setError] = useState('');
  const [showFeishuQR, setShowFeishuQR] = useState(false);

  const handleFeishuLoginSuccess = () => {
    // 飞书扫码登录成功，关闭弹窗
    setShowFeishuQR(false);
    // 登录状态会通过 auth-context 自动更新
  };

  const handleFeishuLoginError = (errorMsg: string) => {
    setError(errorMsg);
    // 保持弹窗打开，让用户可以重试
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
          onClick={() => setShowFeishuQR(true)}
          className="flex items-center gap-2 px-4 py-2 border border-theme-border rounded-lg text-theme-text-secondary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.64 3.53a3.57 3.57 0 0 1 4.54-.5l8.77 6.42a1.68 1.68 0 0 1 .28 2.58l-5.6 6.78a3.56 3.56 0 0 1-5.1.4l-3.27-3.2a1.07 1.07 0 0 1-.22-1.18l2.25-6.65c.34-1 .4-1.63-1.65-3.66a1.07 1.07 0 0 0-.96-.28L1.6 6.2a1.07 1.07 0 0 1-.58-1.9L9.4 1.25a3.57 3.57 0 0 1 2.24-.72z"></path>
          </svg>
          飞书登录
        </button>
      </div>

      {/* 飞书扫码登录弹窗 */}
      {showFeishuQR && (
        <FeishuQRLogin
          onSuccess={handleFeishuLoginSuccess}
          onError={handleFeishuLoginError}
          onClose={() => setShowFeishuQR(false)}
        />
      )}
    </div>
  );
}
