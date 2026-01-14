'use client';

import { useState } from 'react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralScannerProps {
    onCustomerFound: (customerId: string, customerName: string) => void;
}

export function ReferralScanner({ onCustomerFound }: ReferralScannerProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    // Mock implementation for now, should call server action
    const handleScan = async () => {
        if (!code) return;
        setLoading(true);

        try {
            // TODO: Call server action to find customer by referral code (or phone)
            // await findCustomerByReferralCode(code);
            console.log("Scanning code:", code);

            // Mock success
            setTimeout(() => {
                const mockCustomer = { id: 'mock-id', name: 'Mock Customer' };
                onCustomerFound(mockCustomer.id, mockCustomer.name);
                toast.success(`Referrer found: ${mockCustomer.name}`);
                setLoading(false);
            }, 1000);

        } catch (error) {
            toast.error('Invalid referral code');
            setLoading(false);
        }
    };

    return (
        <div className="flex space-x-2">
            <Input
                placeholder="Scan Referral Code / Enter Phone"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            />
            <Button onClick={handleScan} disabled={loading} variant="outline">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
        </div>
    );
}
