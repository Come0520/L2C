'use client';

import { Wrench, Ruler, Users } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperNav, PaperNavItem } from '@/components/ui/paper-nav';

export default function ServiceSupplyPage() {
  const [active, setActive] = React.useState<'overview' | 'surveyors' | 'installers'>('overview');

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">服务与供应链</h1>
            <p className="text-ink-500 mt-1">视图界面、测量师管理、安装师管理</p>
          </div>
        </div>

        <PaperCard>
          <PaperCardContent>
            <PaperNav vertical={false}>
              <PaperNavItem href="#" active={active === 'overview'} onClick={() => setActive('overview')} icon={<Users className="h-5 w-5" />}>总览</PaperNavItem>
              <PaperNavItem href="/service-supply/surveyors" active={active === 'surveyors'} icon={<Ruler className="h-5 w-5" />}>测量师管理</PaperNavItem>
              <PaperNavItem href="/service-supply/installers" active={active === 'installers'} icon={<Wrench className="h-5 w-5" />}>安装师管理</PaperNavItem>
            </PaperNav>
          </PaperCardContent>
        </PaperCard>

        {active === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>测量师</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <p className="text-ink-600 mb-3">团队规模与排班、在途任务与绩效。</p>
                <Link href="/service-supply/surveyors">
                  <PaperButton variant="primary">进入管理</PaperButton>
                </Link>
              </PaperCardContent>
            </PaperCard>
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>安装师</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <p className="text-ink-600 mb-3">施工排期、质量巡检与回访。</p>
                <Link href="/service-supply/installers">
                  <PaperButton variant="primary">进入管理</PaperButton>
                </Link>
              </PaperCardContent>
            </PaperCard>
            <PaperCard>
              <PaperCardHeader>
                <PaperCardTitle>供应商协同</PaperCardTitle>
              </PaperCardHeader>
              <PaperCardContent>
                <p className="text-ink-600 mb-3">对接供应商与库存联动。</p>
                <Link href="/suppliers">
                  <PaperButton variant="outline">查看供应商</PaperButton>
                </Link>
              </PaperCardContent>
            </PaperCard>
          </div>
        )}
      </div>
  );
}
