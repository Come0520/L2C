import React from 'react';
import { CreateTicketForm } from '@/features/after-sales/components/create-ticket-form';

export default function NewTicketPage() {
    return (
        <div className="flex h-full flex-col">
            <CreateTicketForm />
        </div>
    );
}
