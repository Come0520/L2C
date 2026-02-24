/**
 * 新建客户表单包装器（客户端组件）
 *
 * 包装 CustomerForm，处理创建成功后的页面跳转逻辑。
 */
'use client';

import { useRouter } from 'next/navigation';
import { CustomerForm } from './customer-form';

interface NewCustomerFormWrapperProps {
    tenantId: string;
}

export function NewCustomerFormWrapper({ tenantId }: NewCustomerFormWrapperProps) {
    const router = useRouter();

    /**
     * 客户创建成功后跳转到客户详情页
     */
    const handleSuccess = (customer?: { id: string }) => {
        if (customer?.id) {
            router.push(`/customers/${customer.id}`);
        } else {
            router.push('/customers');
        }
    };

    return (
        <CustomerForm
            tenantId={tenantId}
            onSuccess={handleSuccess}
        />
    );
}
