'use client';

import React, { useState } from 'react';

import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { StatefulButton, ButtonStatus } from '@/components/ui/stateful-button';

export default function StatefulButtonDemo() {
  const [status, setStatus] = useState<ButtonStatus>('idle');

  const handleClick = () => {
    setStatus('loading');
    
    // 模拟异步操作
    setTimeout(() => {
      const isSuccess = Math.random() > 0.5;
      setStatus(isSuccess ? 'success' : 'error');
    }, 2000);
  };

  return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-ink-800">Stateful Button Demo</h1>
        
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>基本用法</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <p className="text-ink-500">点击按钮模拟异步操作，随机展示成功或失败状态。</p>
            
            <div className="flex gap-4 items-center">
              <StatefulButton 
                status={status} 
                onClick={handleClick}
                loadingText="提交中..."
                successText="操作成功"
                errorText="操作失败"
              >
                点击提交
              </StatefulButton>

              <StatefulButton 
                variant="secondary"
                status={status} 
                onClick={handleClick}
              >
                次要按钮
              </StatefulButton>

              <StatefulButton 
                variant="outline"
                status={status} 
                onClick={handleClick}
              >
                描边按钮
              </StatefulButton>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>不同状态展示</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <StatefulButton status="idle">空闲状态</StatefulButton>
              <StatefulButton status="loading">加载中</StatefulButton>
              <StatefulButton status="success">成功状态</StatefulButton>
              <StatefulButton status="error">错误状态</StatefulButton>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
}
