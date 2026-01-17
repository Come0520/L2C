'use client';

import { useForm } from "react-hook-form";
import { Form } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";

interface ChannelFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: any[];
}

export function ChannelForm({ open, onOpenChange, categories }: ChannelFormProps) {
    const form = useForm();
    return (
        <div className="space-y-4">
            <p className="text-muted-foreground">Channel Form not available in recovery mode.</p>
        </div>
    );
}
