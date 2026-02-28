'use client';

import React from 'react';
import { versionHistory } from '@/constants/landing-data';
import { Rocket, Sparkles, Wrench, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistoryModal({ isOpen, onClose }: VersionHistoryModalProps) {
  // 根据类型显示对应图标
  const renderUpdateIcon = (type: 'feature' | 'fix' | 'optimize') => {
    switch (type) {
      case 'feature':
        return <Sparkles className="h-4 w-4 text-emerald-500" />;
      case 'fix':
        return <Wrench className="h-4 w-4 text-rose-500" />;
      case 'optimize':
        return <Rocket className="h-4 w-4 text-blue-500" />;
    }
  };

  const renderUpdateLabel = (type: 'feature' | 'fix' | 'optimize') => {
    switch (type) {
      case 'feature':
        return '新增';
      case 'fix':
        return '修复';
      case 'optimize':
        return '优化';
    }
  };

  const renderUpdateBadgeColor = (type: 'feature' | 'fix' | 'optimize') => {
    switch (type) {
      case 'feature':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20';
      case 'fix':
        return 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20';
      case 'optimize':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 覆盖默认 Dialog 内容样式以增加滚动和特定宽度的美化 */}
      <DialogContent className="max-w-2xl gap-0 overflow-hidden border-slate-200/50 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:rounded-2xl dark:border-white/10 dark:bg-slate-950/90">
        <div className="relative border-b border-slate-100 px-6 py-5 dark:border-white/5">
          {/* 背景光影 */}
          <div className="absolute inset-x-0 -top-24 -z-10 h-32 w-full bg-linear-to-r from-blue-500/10 to-purple-500/10 blur-2xl dark:from-blue-500/20 dark:to-purple-500/20" />

          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              L2C
            </span>
            更新与荣誉记录
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            每一次微小的进步，都是共建者们心血的结晶
          </p>
        </div>

        {/* 滚动记录区域 */}
        <div className="scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 max-h-[65vh] overflow-y-auto px-6 py-6">
          <div className="relative ml-4 space-y-12 border-l-2 border-slate-200 dark:border-slate-800">
            {versionHistory.map((ver) => (
              <div key={ver.id} className="relative pl-8">
                {/* 轴上的圆点 */}
                <div className="absolute top-1 -left-[9px] h-4 w-4 rounded-full border-2 border-white bg-blue-500 ring-4 ring-blue-50 dark:border-slate-950 dark:bg-blue-500 dark:ring-blue-900/50" />

                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-baseline">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {ver.version}：{ver.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <time dateTime={ver.date}>{ver.date}</time>
                  </div>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {ver.description}
                </p>

                {ver.contributors && ver.contributors.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                      荣誉致谢:
                    </span>
                    {ver.contributors.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <ul className="space-y-3">
                  {ver.updates.map((update, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <div className="flex flex-none flex-row items-center gap-1 pt-0.5">
                        {renderUpdateIcon(update.type)}
                        <span
                          className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${renderUpdateBadgeColor(update.type)}`}
                        >
                          {renderUpdateLabel(update.type)}
                        </span>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{update.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
