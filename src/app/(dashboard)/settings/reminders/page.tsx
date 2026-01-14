'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardPageHeader } from '@/shared/ui/dashboard-page-header';
import { DashboardFilterBar } from '@/shared/ui/dashboard-filter-bar';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { ReminderRuleList } from '@/features/settings/components/reminder-rule-list';
import { ReminderRuleForm } from '@/features/settings/components/reminder-rule-form';
import { getReminderRules, type ReminderModule } from '@/features/settings/reminder-actions';
import { reminderRules } from '@/shared/api/schema';
import { InferSelectModel } from 'drizzle-orm';
import { useEffect } from 'react';

type ReminderRule = InferSelectModel<typeof reminderRules>;

const TABS = [
    { title: '线索', value: 'LEAD' },
    { title: '订单', value: 'ORDER' },
    { title: '测量', value: 'MEASURE' },
    { title: '安装', value: 'INSTALL' },
    { title: '应收', value: 'AR' },
    { title: '应付', value: 'AP' },
];

function RemindersContent() {
    const searchParams = useSearchParams();
    const activeModule = (searchParams.get('module') || 'LEAD') as ReminderModule;

    const [rules, setRules] = useState<ReminderRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formOpen, setFormOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<ReminderRule | undefined>(undefined);

    useEffect(() => {
        async function loadRules() {
            setIsLoading(true);
            const res = await getReminderRules({ module: activeModule });
            if (res.success && res.data) {
                setRules(res.data);
            }
            setIsLoading(false);
        }
        loadRules();
    }, [activeModule]);

    const handleEdit = (rule: ReminderRule) => {
        setEditingRule(rule);
        setFormOpen(true);
    };

    const handleCreate = () => {
        setEditingRule(undefined);
        setFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <DashboardPageHeader
                title="提醒规则"
                subtitle="配置各模块的自动提醒触发条件和通知渠道"
            >
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    新建规则
                </Button>
            </DashboardPageHeader>

            <DashboardFilterBar
                tabs={TABS}
                paramName="module"
                defaultValue="LEAD"
                showSearch={false}
            />

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
                    ))}
                </div>
            ) : (
                <ReminderRuleList rules={rules} onEdit={handleEdit} />
            )}

            <ReminderRuleForm
                open={formOpen}
                onOpenChange={setFormOpen}
                module={activeModule}
                initialData={editingRule}
            />
        </div>
    );
}

export default function RemindersPage() {
    return (
        <Suspense fallback={<div className="p-6">加载�?..</div>}>
            <RemindersContent />
        </Suspense>
    );
}
