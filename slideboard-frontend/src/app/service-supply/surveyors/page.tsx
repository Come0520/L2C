'use client';

import { Ruler, Calendar } from 'lucide-react';
import React from 'react';

import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput, PaperSelect } from '@/components/ui/paper-input';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

interface Surveyor {
  id: string;
  name: string;
  phone: string;
  region: string;
  tasksToday: number;
  status: 'idle' | 'on-route' | 'busy';
}

export default function SurveyorsPage() {
  const [region, setRegion] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const surveyors: Surveyor[] = [
    { id: 's1', name: '张三', phone: '13800000001', region: '华东', tasksToday: 3, status: 'on-route' },
    { id: 's2', name: '李四', phone: '13800000002', region: '华南', tasksToday: 1, status: 'idle' },
    { id: 's3', name: '王五', phone: '13800000003', region: '华北', tasksToday: 5, status: 'busy' },
  ];

  const filtered = surveyors.filter(s =>
    (region === 'all' || s.region === region) &&
    (s.name.includes(search) || s.phone.includes(search))
  );

  const statusText = (st: Surveyor['status']) => st === 'idle' ? '空闲' : st === 'on-route' ? '在途' : '忙碌';
  const statusBadge = (st: Surveyor['status']) => st === 'idle' ? 'info' : st === 'on-route' ? 'success' : 'warning';

  return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">测量师管理</h1>
            <p className="text-ink-500 mt-1">排班与在途任务</p>
          </div>
          <PaperButton variant="outline"><Calendar className="h-4 w-4 mr-2" /> 排班日历</PaperButton>
        </div>

        <PaperCard>
          <PaperCardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <PaperInput placeholder="搜索姓名/手机号" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="w-48">
                <PaperSelect value={region} onChange={(e) => setRegion(e.target.value)} options={[
                  { value: 'all', label: '全部区域' },
                  { value: '华东', label: '华东' },
                  { value: '华南', label: '华南' },
                  { value: '华北', label: '华北' },
                ]} />
              </div>
              <PaperButton><Ruler className="h-4 w-4 mr-2" /> 新增测量师</PaperButton>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>人员列表</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>姓名</PaperTableCell>
                <PaperTableCell>电话</PaperTableCell>
                <PaperTableCell>区域</PaperTableCell>
                <PaperTableCell>今日任务</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {filtered.map(s => (
                  <PaperTableRow key={s.id}>
                    <PaperTableCell>{s.name}</PaperTableCell>
                    <PaperTableCell>{s.phone}</PaperTableCell>
                    <PaperTableCell>{s.region}</PaperTableCell>
                    <PaperTableCell>{s.tasksToday}</PaperTableCell>
                    <PaperTableCell>
                      <PaperBadge variant={statusBadge(s.status)}>{statusText(s.status)}</PaperBadge>
                    </PaperTableCell>
                  </PaperTableRow>
                ))}
              </PaperTableBody>
            </PaperTable>
          </PaperCardContent>
        </PaperCard>
      </div>
  );
}

