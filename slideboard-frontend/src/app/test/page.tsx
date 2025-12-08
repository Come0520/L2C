'use client';

import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { toast } from '@/components/ui/toast';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-paper-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-ink-600 mb-8">暖宣纸主题测试页面</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>卡片标题</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <p className="text-ink-600 mb-4">这是一个使用暖宣纸主题的卡片组件，具有柔和的纸质纹理效果。</p>
              <PaperButton variant="primary" onClick={() => toast.info('按钮点击!')}>
                主要按钮
              </PaperButton>
            </PaperCardContent>
          </PaperCard>
          
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>统计数据</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-ink-600 mb-2">1,234</div>
                <div className="text-sm text-ink-500">总订单数</div>
              </div>
            </PaperCardContent>
          </PaperCard>
          
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>操作面板</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="space-y-3">
                <PaperButton variant="outline" size="sm" className="w-full">
                  查看详情
                </PaperButton>
                <PaperButton variant="secondary" size="sm" className="w-full">
                  编辑信息
                </PaperButton>
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>
        
        <div className="mt-8 paper-card">
          <div className="paper-card-header">
            <h2 className="text-xl font-semibold text-ink-600">主题色彩展示</h2>
          </div>
          <div className="paper-card-content">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-paper-200 rounded-lg mx-auto mb-2"></div>
                <div className="text-sm text-ink-600">背景色</div>
                <div className="text-xs text-ink-500">#FBF8EE</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-paper-300 rounded-lg mx-auto mb-2"></div>
                <div className="text-sm text-ink-600">卡片色</div>
                <div className="text-xs text-ink-500">#F1EEDE</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-ink-600 rounded-lg mx-auto mb-2"></div>
                <div className="text-sm text-ink-600">主文本</div>
                <div className="text-xs text-ink-500">#3B3A35</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-ink-500 rounded-lg mx-auto mb-2"></div>
                <div className="text-sm text-ink-600">副文本</div>
                <div className="text-xs text-ink-500">#757365</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
