'use client';

import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Form } from "@/shared/ui/form";

interface UserFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    onSuccess: () => void;
}

export function UserForm({ open, onOpenChange, initialData, onSuccess }: UserFormProps) {
    const form = useForm();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit User' : 'Create User'}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-muted-foreground">User form not available in recovery mode.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
