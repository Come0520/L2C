'use client';

import React from 'react';

import { LiquidCard } from '@/components/ui/liquid-card';

export default function LiquidDemoPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] p-8">
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Liquid Glass Effect</h1>
        <p className="text-gray-400">基于 Framer Motion 和 Tailwind CSS 的液态玻璃拟态组件</p>
      </div>

      <div className="relative">
        {/* 背景装饰球 */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse" />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-pulse delay-75" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {/* 卡片 1: 功能展示 */}
            <LiquidCard className="w-80 h-96">
                <div className="flex flex-col justify-between h-full">
                <div>
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4 border border-white/30 shadow-inner">
                    {/* 图标 */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-white">Liquid Glass</h3>
                    <p className="mt-2 text-sm text-gray-300">
                    这是一个基于 Tailwind v4 和 Framer Motion 的液态玻璃组件。具有物理弹簧效果和动态光照。
                    </p>
                </div>
                
                <button className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-sm font-medium text-white cursor-pointer">
                    查看详情
                </button>
                </div>
            </LiquidCard>

             {/* 卡片 2: 登录表单示例 */}
             <LiquidCard className="w-80 h-auto min-h-96">
                <div className="flex flex-col h-full">
                    <h3 className="text-xl font-bold mb-6 text-center text-white">用户登录</h3>
                    
                    <div className="space-y-4 flex-1">
                        <div>
                            <label className="text-xs text-gray-300 mb-1 block">邮箱</label>
                            <input type="email" className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder-white/30" placeholder="user@example.com" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-300 mb-1 block">密码</label>
                            <input type="password" className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30 transition-all placeholder-white/30" placeholder="••••••••" />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded bg-white/10 border-white/20" />
                                记住我
                            </label>
                            <a href="#" className="hover:text-white transition-colors">忘记密码?</a>
                        </div>
                    </div>

                    <button className="w-full mt-6 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border border-white/10 transition-all text-sm font-medium text-white shadow-lg cursor-pointer">
                        登录
                    </button>
                </div>
            </LiquidCard>
        </div>
      </div>
    </div>
  );
}
