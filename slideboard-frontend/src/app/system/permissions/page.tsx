'use client';
import React from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperTable, PaperTableHeader, PaperTableBody, PaperTableRow, PaperTableCell } from '@/components/ui/paper-table';

export default function SystemPermissionsPage() {
  const roles = [
    { name: 'ADMIN', perms: ['*'] },
    { name: 'SALES_MANAGER', perms: ['leads:read', 'leads:write', 'orders:approve'] },
    { name: 'USER', perms: ['products:read'] },
  ];
  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-ink-800">权限管理</h1>
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>角色与权限</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            <PaperTable>
              <PaperTableHeader>
                <PaperTableCell>角色</PaperTableCell>
                <PaperTableCell>权限</PaperTableCell>
              </PaperTableHeader>
              <PaperTableBody>
                {roles.map(r => (
                  <PaperTableRow key={r.name}>
                    <PaperTableCell>{r.name}</PaperTableCell>
                    <PaperTableCell>{r.perms.join(', ')}</PaperTableCell>
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

