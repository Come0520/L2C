'use client';

import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { toast } from '@/components/ui/toast';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-theme-bg-primary p-8 theme-warm">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-theme-text-primary">暖宣纸主题</h1>
          <p className="text-xl text-theme-text-secondary">L2C 销售管理系统设计规范</p>
        </div>

        {/* Color Palette */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>基础色板 (Color Palette)</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <ColorBox name="纸张-200" code="#FBF8EE" variable="--color-paper-200" className="bg-[var(--color-paper-200)]" />
              <ColorBox name="纸张-300" code="#F1EEDE" variable="--color-paper-300" className="bg-[var(--color-paper-300)]" />
              <ColorBox name="墨水-600" code="#3B3A35" variable="--color-ink-600" className="bg-[var(--color-ink-600)] text-white" />
              <ColorBox name="墨水-500" code="#757365" variable="--color-ink-500" className="bg-[var(--color-ink-500)] text-white" />
              <ColorBox name="品牌主色" code="#5D5FEF" variable="--color-primary-500" className="bg-[var(--color-primary-500)] text-white" />
              <ColorBox name="成功色" code="#10B981" variable="--color-success-500" className="bg-[var(--color-success-500)] text-white" />
              <ColorBox name="警告色" code="#F59E0B" variable="--color-warning-500" className="bg-[var(--color-warning-500)] text-white" />
              <ColorBox name="错误色" code="#EF4444" variable="--color-error-500" className="bg-[var(--color-error-500)] text-white" />
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Semantic Tokens */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>语义化 Token (Semantic Tokens)</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-theme-text-secondary mb-4 uppercase tracking-wider">背景 (Backgrounds)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <ColorBox name="页面背景" code="Paper 50" variable="--theme-bg-primary" className="bg-theme-bg-primary border border-theme-border" />
                  <ColorBox name="容器背景" code="Paper 200" variable="--theme-bg-secondary" className="bg-theme-bg-secondary" />
                  <ColorBox name="侧栏/强调" code="Paper 300" variable="--theme-bg-tertiary" className="bg-theme-bg-tertiary" />
                  <ColorBox name="卡片背景" code="White" variable="--bg-card" className="bg-[var(--bg-card)] border border-theme-border" />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-theme-text-secondary mb-4 uppercase tracking-wider">文本 & 边框 (Text & Border)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <ColorBox name="主要文本" code="Ink 900" variable="--theme-text-primary" className="bg-theme-bg-primary text-theme-text-primary border border-theme-border" />
                  <ColorBox name="次要文本" code="Ink 500" variable="--theme-text-secondary" className="bg-theme-bg-primary text-theme-text-secondary border border-theme-border" />
                  <ColorBox name="主要边框" code="Paper 600" variable="--theme-border" className="bg-theme-bg-primary border-2 border-theme-border" />
                  <ColorBox name="次要边框" code="Paper 400" variable="--theme-border-light" className="bg-theme-bg-primary border-2 border-theme-border-light" />
                </div>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Typography */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>排版系统 (Typography)</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-6">
            <div className="space-y-2 border-b border-theme-border pb-4">
              <h1 className="text-4xl font-bold text-theme-text-primary">Heading 1 - 页面标题</h1>
              <p className="text-sm text-theme-text-secondary">text-4xl font-bold</p>
            </div>
            <div className="space-y-2 border-b border-theme-border pb-4">
              <h2 className="text-3xl font-bold text-theme-text-primary">Heading 2 - 模块标题</h2>
              <p className="text-sm text-theme-text-secondary">text-3xl font-bold</p>
            </div>
            <div className="space-y-2 border-b border-theme-border pb-4">
              <h3 className="text-2xl font-semibold text-theme-text-primary">Heading 3 - 卡片标题</h3>
              <p className="text-sm text-theme-text-secondary">text-2xl font-semibold</p>
            </div>
            <div className="space-y-2">
              <p className="text-base text-theme-text-primary leading-relaxed">
                正文内容 (Body Text) - 采用暖沙色、米色调的变体，比纯白更护眼，比深色模式更适合长时间阅读文字和图表，
                给人一种温暖、复古、类似纸张的高级感。核心理念是“柔和的纸上书写体验”。
              </p>
              <p className="text-sm text-theme-text-secondary">text-base leading-relaxed</p>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* Components */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>交互组件 (Components)</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-8">
            {/* Buttons */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-theme-text-primary">按钮 (Buttons)</h3>
              <div className="flex flex-wrap gap-4">
                <PaperButton variant="primary" onClick={() => toast.success('主要按钮点击')}>主要按钮</PaperButton>
                <PaperButton variant="secondary" onClick={() => toast.info('次要按钮点击')}>次要按钮</PaperButton>
                <PaperButton variant="outline" onClick={() => toast('描边按钮点击')}>描边按钮</PaperButton>
                <PaperButton variant="ghost" onClick={() => toast('幽灵按钮点击')}>幽灵按钮</PaperButton>
                <PaperButton variant="error" onClick={() => toast.error('危险按钮点击')}>危险按钮</PaperButton>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-theme-text-primary">卡片 (Cards)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PaperCard className="hover:shadow-md transition-shadow">
                  <PaperCardHeader>
                    <PaperCardTitle>基础卡片</PaperCardTitle>
                  </PaperCardHeader>
                  <PaperCardContent>
                    <p className="text-theme-text-secondary">最基础的卡片容器，带有默认的内边距和圆角。</p>
                  </PaperCardContent>
                </PaperCard>
                
                <PaperCard className="bg-theme-bg-secondary border-dashed">
                  <PaperCardHeader>
                    <PaperCardTitle>虚线边框卡片</PaperCardTitle>
                  </PaperCardHeader>
                  <PaperCardContent>
                    <div className="flex items-center justify-center h-20 text-theme-text-secondary">
                      适用于“添加内容”或“占位符”场景
                    </div>
                  </PaperCardContent>
                </PaperCard>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
    </div>
  );
}

function ColorBox({ name, code, variable, className }: { name: string; code: string; variable: string; className: string }) {
  return (
    <div className="flex flex-col space-y-2">
      <div className={`h-24 w-full rounded-xl shadow-sm flex items-center justify-center ${className}`}>
        <span className="text-xs font-mono opacity-80">{variable}</span>
      </div>
      <div>
        <div className="font-medium text-theme-text-primary">{name}</div>
        <div className="text-sm text-theme-text-secondary font-mono">{code}</div>
      </div>
    </div>
  );
}
