'use client';

import React from 'react';

export default function CompareDemoPage() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
                <h1 className="text-2xl font-bold tracking-tight">报价对比演示 (Quote Compare Demo)</h1>
            </div>
            <div className="flex-1 p-6">
                <div className="rounded-md border p-4 text-center text-muted-foreground">
                    报价对比功能演示在此模式下不可用。
                </div>
            </div>
        </div>
    );
}
