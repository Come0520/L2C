'use client';

import { Wrench, Calendar } from 'lucide-react';
import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperBadge } from '@/components/ui/paper-badge';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput, PaperSelect } from '@/components/ui/paper-input';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

interface Installer {
  id: string;
  name: string;
  phone: string;
  team: string;
  jobsToday: number;
  status: 'idle' | 'assigned' | 'working';
}

export default function InstallersPage() {
  const [team, setTeam] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const installers: Installer[] = [
    { id: 'i1', name: '赵六', phone: '13800000011', team: 'A组', jobsToday: 2, status: 'assigned' },
    { id: 'i2', name: '钱七', phone: '13800000012', team: 'B组', jobsToday: 0, status: 'idle' },
    { id: 'i3', name: '孙八', phone: '13800000013', team: 'A组', jobsToday: 3, status: 'working' },
  ];

  const filtered = installers.filter(s =>
    (team === 'all' || s.team === team) &&
    (s.name.includes(search) || s.phone.includes(search))
  );

  const statusText = (st: Installer['status']) => st === 'idle' ? '空闲' : st === 'assigned' ? '已派工' : '施工中';
  const statusBadge = (st: Installer['status']) => st === 'idle' ? 'info' : st === 'assigned' ? 'warning' : 'success';

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink-800">安装师管理</h1>
            <p className="text-ink-500 mt-1">施工排期与质检回访</p>
          </div>
          <PaperButton variant="outline"><Calendar className="h-4 w-4 mr-2" /> 施工日程</PaperButton>
        </div>

        <PaperCard>
          <PaperCardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <PaperInput placeholder="搜索姓名/手机号" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="w-48">
                <PaperSelect value={team} onChange={(e) => setTeam(e.target.value)} options={[
                  { value: 'all', label: '全部班组' },
                  { value: 'A组', label: 'A组' },
                  { value: 'B组', label: 'B组' },
                ]} />
              </div>
              <PaperButton><Wrench className="h-4 w-4 mr-2" /> 新增安装师</PaperButton>
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
                <PaperTableCell>班组</PaperTableCell>
                <PaperTableCell>今日工单</PaperTableCell>
                <PaperTableCell>状态</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {filtered.map(s => (
                  <PaperTableRow key={s.id}>
                    <PaperTableCell>{s.name}</PaperTableCell>
                    <PaperTableCell>{s.phone}</PaperTableCell>
                    <PaperTableCell>{s.team}</PaperTableCell>
                    <PaperTableCell>{s.jobsToday}</PaperTableCell>
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
    </DashboardLayout>
  );
}

