import { QuickQuoteForm } from "@/features/quotes/quick-quote/components/quick-quote-form";
import { getLeadById } from "@/features/leads/actions/queries";
import { fetchQuotePlans } from "@/features/quotes/lib/plan-loader";
import { notFound } from "next/navigation";
import { Separator } from "@/shared/ui/separator";
import { auth } from "@/shared/lib/auth";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function QuickQuotePage({ params }: PageProps) {
    const { id } = await params;
    let lead, plans;
    try {
        const result = await getLeadById({ id });
        if (!result.success || !result.data) {
            notFound();
        }
        lead = result.data;

        // Fetch quote plans
        const session = await auth();
        if (!session?.user?.tenantId) {
            notFound();
        }
        plans = await fetchQuotePlans(session.user.tenantId);
    } catch (error) {
        console.error('QuickQuotePage Load Error:', error);
        throw error;
    }

    return (
        <div className="container mx-auto py-8 max-w-5xl">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">快速报价</h1>
                <p className="text-gray-500">
                    为线索 <span className="font-medium text-primary-600">#{lead.leadNo} ({lead.customerName})</span> 创建一份基于预设方案的初步报价。
                </p>
            </div>

            <Separator className="mb-8" />

            <QuickQuoteForm leadId={id} plans={plans} />
        </div>
    );
}
