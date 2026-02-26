// @ts-nocheck
import { PageHeader } from '@/components/ui/page-header';
import { JournalEntryForm } from '@/features/finance/components/journal-entry-form';
import { getAccountOptions, getOpenPeriods } from '@/features/finance/actions/journal-entry-actions';

export default async function CreateJournalPage() {
    const [accountOptions, periodOptions] = await Promise.all([
        getAccountOptions(),
        getOpenPeriods()
    ]);

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <PageHeader
                title="新增手工记账"
                description="手工录入财务记账凭证"
                breadcrumbs={[
                    { label: '财务中心', href: '/finance' },
                    { label: '手工记账', href: '/finance/journal' },
                    { label: '新增记账' },
                ]}
            />
            <div className="max-w-5xl">
                <JournalEntryForm
                    accountOptions={accountOptions}
                    periodOptions={periodOptions}
                />
            </div>
        </div>
    );
}

