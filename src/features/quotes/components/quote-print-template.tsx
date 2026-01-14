'use client';

import React from 'react';

export function QuotePrintTemplate() {
    return (
        <div className="p-8 border bg-white text-black">
            <h1 className="text-2xl font-bold mb-4">报价单打印模板 (Print Template)</h1>
            <p>打印功能在恢复模式下暂不可用。</p>
            <p className="text-sm text-gray-500">(Print template is not available in recovery mode.)</p>
        </div>
    );
}
