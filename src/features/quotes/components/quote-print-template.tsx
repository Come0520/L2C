'use client';

import React from 'react';

export function QuotePrintTemplate() {
  return (
    <div className="border bg-white p-8 text-black">
      <h1 className="mb-4 text-2xl font-bold">报价单打印模板 (Print Template)</h1>
      <p>打印功能在恢复模式下暂不可用。</p>
      <p className="text-sm text-gray-500">(Print template is not available in recovery mode.)</p>
    </div>
  );
}
