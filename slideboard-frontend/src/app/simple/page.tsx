import React from 'react';

export default function SimplePage() {
  return (
    <div className="min-h-screen bg-paper-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-ink-600 mb-8">暖宣纸主题 - L2C销售管理系统</h1>
        
        <div className="paper-card mb-6">
          <div className="paper-card-header">
            <h2 className="text-xl font-semibold text-ink-600">系统功能模块</h2>
          </div>
          <div className="paper-card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="paper-card p-4">
                <h3 className="font-semibold text-ink-600 mb-2">工作台</h3>
                <p className="text-sm text-ink-500">业务概览与快速操作</p>
              </div>
              <div className="paper-card p-4">
                <h3 className="font-semibold text-ink-600 mb-2">客户管理</h3>
                <p className="text-sm text-ink-500">装企合作与CRM系统</p>
              </div>
              <div className="paper-card p-4">
                <h3 className="font-semibold text-ink-600 mb-2">订单管理</h3>
                <p className="text-sm text-ink-500">订单流程与状态跟踪</p>
              </div>
              <div className="paper-card p-4">
                <h3 className="font-semibold text-ink-600 mb-2">商品库存</h3>
                <p className="text-sm text-ink-500">产品与库存管理</p>
              </div>
              <div className="paper-card p-4">
                <h3 className="font-semibold text-ink-600 mb-2">供应链</h3>
                <p className="text-sm text-ink-500">服务与供应商管理</p>
              </div>
              <div className="paper-card p-4">
                <h3 className="font-semibold text-ink-600 mb-2">积分商城</h3>
                <p className="text-sm text-ink-500">积分系统与商品兑换</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="paper-card">
          <div className="paper-card-header">
            <h2 className="text-xl font-semibold text-ink-600">主题色彩系统</h2>
          </div>
          <div className="paper-card-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-paper-200 rounded-lg mx-auto mb-2 border border-paper-600"></div>
                <div className="text-sm text-ink-600 font-medium">背景色</div>
                <div className="text-xs text-ink-500">#FBF8EE</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-paper-300 rounded-lg mx-auto mb-2 border border-paper-600"></div>
                <div className="text-sm text-ink-600 font-medium">卡片色</div>
                <div className="text-xs text-ink-500">#F1EEDE</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-ink-600 rounded-lg mx-auto mb-2"></div>
                <div className="text-sm text-ink-600 font-medium">主文本</div>
                <div className="text-xs text-ink-500">#3B3A35</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-ink-500 rounded-lg mx-auto mb-2"></div>
                <div className="text-sm text-ink-600 font-medium">副文本</div>
                <div className="text-xs text-ink-500">#757365</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-paper-300 rounded-lg border border-paper-600">
              <h3 className="font-semibold text-ink-600 mb-2">设计理念</h3>
              <p className="text-sm text-ink-600 leading-relaxed">
                采用暖沙色、米色调的变体，比纯白更护眼，比深色模式更适合长时间阅读文字和图表，
                给人一种温暖、复古、类似纸张的高级感。核心理念是<strong className="text-ink-600">“柔和的纸上书写体验”</strong>。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}