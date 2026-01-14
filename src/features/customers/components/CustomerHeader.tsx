'use client';

import { useRouter } from 'next/navigation';
import { CreateCustomerDialog } from './create-customer-dialog';
import { ReferralScanner } from './ReferralScanner';
import { Button } from '@/shared/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerHeaderProps {
    userId: string;
    tenantId: string;
}

export function CustomerHeader({ userId, tenantId }: CustomerHeaderProps) {
    const router = useRouter();

    const handleCustomerFound = (customerId: string, customerName: string) => {
        toast.success(`Checking referral: ${customerName}`);
        router.push(`/customers/${customerId}`);
    };

    return (
        <div className="flex justify-between items-center gap-4">
            <h1 className="text-2xl font-bold tracking-tight">客户管理</h1>
            <div className="flex items-center gap-2">
                <ReferralScanner onCustomerFound={handleCustomerFound} />
                <CreateCustomerDialog
                    userId={userId}
                    tenantId={tenantId}
                    trigger={
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            新建客户
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
