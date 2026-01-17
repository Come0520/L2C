import React from 'react';
import { getInstallTasks } from '@/features/service/installation/actions';
import { InstallTaskTable } from '@/features/service/installation/components/install-task-table';
import { CreateInstallTaskDialog } from '@/features/service/installation/components/create-install-task-dialog';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InstallationPage() {
    const result = await getInstallTasks();
    const tasks = result.success ? (result.data || []) : [];

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b px-6 py-4">
                <h1 className="text-2xl font-bold tracking-tight">安装服务 (Installation Service)</h1>
                <CreateInstallTaskDialog
                    trigger={
                        <Button size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            新建安装单
                        </Button>
                    }
                />
            </div>
            <div className="flex-1 p-6">
                <InstallTaskTable data={tasks} />
            </div>
        </div>
    );
}

