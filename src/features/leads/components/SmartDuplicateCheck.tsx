'use client';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface SmartDuplicateCheckProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    conflictData: {
        type: 'PHONE' | 'ADDRESS';
        existingEntity: { id: string; name: string; owner?: string };
    } | null;
    onStrategySelect: (strategy: 'LINK' | 'OVERWRITE' | 'CANCEL') => void;
}

export function SmartDuplicateCheck({ isOpen, onOpenChange, conflictData, onStrategySelect }: SmartDuplicateCheckProps) {
    if (!conflictData) return null;

    const { type, existingEntity } = conflictData;

    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Duplicate Lead Detected</AlertDialogTitle>
                    <AlertDialogDescription>
                        A {type === 'PHONE' ? 'customer' : 'lead'} with this {type.toLowerCase()} already exists:
                        <span className="font-semibold"> {existingEntity.name}</span>
                        {existingEntity.owner && ` (Owner: ${existingEntity.owner})`}.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={() => onStrategySelect('CANCEL')}>Cancel</AlertDialogCancel>

                    <AlertDialogAction onClick={() => onStrategySelect('LINK')}>
                        Link to Existing
                    </AlertDialogAction>

                    {/* Only allow overwrite if user has permission (handled by parent logic preferably) */}
                    {/* <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => onStrategySelect('OVERWRITE')}>
                        Force Overwrite
                     </AlertDialogAction> */}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
