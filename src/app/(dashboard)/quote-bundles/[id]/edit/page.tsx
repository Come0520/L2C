import { auth } from '@/shared/lib/auth';
import { getQuoteBundleById } from '@/features/quotes/actions/queries';
import { QuoteBundleEditor } from '@/features/quotes/components/quote-bundle-editor';
import { notFound } from 'next/navigation';

export default async function EditQuoteBundlePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const session = await auth();
    const result = await getQuoteBundleById({ id });

    if (!result.success || !result.data) {
        notFound();
    }

    // Ensure serializable (Date objects -> strings)
    const initialData = JSON.parse(JSON.stringify(result.data));

    return (
        <QuoteBundleEditor
            initialData={initialData}
            initialCustomerId={result.data.customerId}
            initialLeadId={result.data.leadId || undefined}
        />
    );
}
