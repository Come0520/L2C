'use client';

import { useState, useEffect } from 'react';

interface FeishuQRLoginProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export function FeishuQRLogin({ onSuccess, onError, onClose }: FeishuQRLoginProps) {
  const [loading, setLoading] = useState<boolean>(true);

  // 加载飞书扫码登录 SDK
  useEffect(() => {
    const loadFeishuSDK = () => {
      // 检查 SDK 是否已加载
      if ((window as any).LarkSSOSDKWebQRCode) {
        initQRLogin();
        return;
      }

      // 避免重复加载
      if (document.getElementById('feishu-sdk')) {
        // 如果正在加载，等待一下
        setTimeout(loadFeishuSDK, 100);
        return;
      }

      const script = document.createElement('script');
      script.id = 'feishu-sdk';
      // 使用飞书官方 Web 扫码登录 SDK
      script.src = 'https://sf3-cn.feishucdn.com/obj/static/lark/passport/qrcode/LarkSSOSDKWebQRCode-1.0.3.js';
      script.onload = () => initQRLogin();
      script.onerror = () => {
        onError('飞书 SDK 加载失败');
        setLoading(false);
      };
      document.body.appendChild(script);
    };

    const initQRLogin = () => {
      try {
        const SDK = (window as any).LarkSSOSDKWebQRCode;
        if (!SDK) {
          console.error('LarkSSOSDKWebQRCode not found');
          return;
        }

        const container = document.getElementById('feishu_qr_container');
        if (!container) return;
        
        container.innerHTML = ''; // 清理容器

        // 构造重定向 URL
        // 必须与飞书后台配置的重定向 URL 一致
        // 线上环境: https://your-domain.com/api/auth/callback/feishu
        const redirectUri = window.location.origin + '/api/auth/callback/feishu';
        const appId = process.env.NEXT_PUBLIC_FEISHU_APP_ID;

        if (!appId) {
            onError('缺少飞书 App ID 配置');
            return;
        }

        const QRLoginObj = SDK.create({
          appid: appId,
          redirect_uri: redirectUri,
          state: 'feishu_login', // 用于防止 CSRF，也可以用来标识来源
          style: 'width:300px;height:300px' // 二维码容器大小
        });

        QRLoginObj.mount('feishu_qr_container');
        setLoading(false);

      } catch (error: any) {
        onError(`二维码初始化失败: ${error.message}`);
        setLoading(false);
      }
    };

    loadFeishuSDK();
  }, [onError]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl p-6 w-[360px] relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">飞书扫码登录</h3>
        </div>
        
        <div className="flex justify-center items-center min-h-[300px]" id="feishu_qr_container">
          {loading && (
            <div className="flex flex-col items-center gap-2 text-theme-text-secondary">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <span>加载中...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}