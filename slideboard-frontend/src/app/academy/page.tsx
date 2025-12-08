import { GraduationCap } from 'lucide-react';
import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';

export default function AcademyPage() {
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-ink-800">罗莱大学</h1>
          <p className="text-ink-500 mt-1">专业知识与系统学习</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>专业知识</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <ul className="text-ink-700 space-y-2 list-disc list-inside">
                <li><a href="/academy/knowledge/curtain" className="text-ink-800">窗帘知识</a></li>
                <li><a href="/academy/knowledge/functional-curtain" className="text-ink-800">功能帘知识</a></li>
                <li><a href="/academy/knowledge/wallpaper" className="text-ink-800">墙布知识</a></li>
                <li><a href="/academy/knowledge/wall-panels" className="text-ink-800">墙咔知识</a></li>
              </ul>
            </PaperCardContent>
          </PaperCard>
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>系统学习</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <ul className="text-ink-700 space-y-2 list-disc list-inside">
                <li><a href="/academy/systems/l2c" className="text-ink-800">L2C 系统</a></li>
                <li><a href="/academy/systems/home" className="text-ink-800">HOME 系统</a></li>
                <li><a href="/academy/systems/curtain-crm" className="text-ink-800">帘客云系统</a></li>
              </ul>
            </PaperCardContent>
          </PaperCard>
          <PaperCard>
            <PaperCardHeader>
              <PaperCardTitle>学习进度</PaperCardTitle>
            </PaperCardHeader>
            <PaperCardContent>
              <div className="flex items-center space-x-3">
                <GraduationCap className="h-5 w-5" />
                <span className="text-ink-700">你已完成 8 / 12 门课程</span>
              </div>
            </PaperCardContent>
          </PaperCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
