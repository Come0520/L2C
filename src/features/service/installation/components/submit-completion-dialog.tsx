'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/shared/ui/dialog';
import { checkOutInstallTaskAction } from '../actions';
import { toast } from 'sonner';
import { SignatureCanvas } from './signature-canvas';

interface SubmitInstallCompletionDialogProps {
    taskId: string;
    trigger?: React.ReactNode;
}

export function SubmitInstallCompletionDialog({ taskId, trigger }: SubmitInstallCompletionDialogProps) {
    const [open, setOpen] = useState(false);
    // const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'CONFIRM' | 'SIGN'>('CONFIRM');
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

    async function handleConfirm() {
        // setIsLoading(true);
        try {
            const result = await checkOutInstallTaskAction({
                id: taskId,
                customerSignatureUrl: signatureUrl || undefined,
            });

            if (result.data?.success) {
                toast.success(result.data.message || '已提交完工申请');
                setOpen(false);
                // Reset state
                setStep('CONFIRM');
                setSignatureUrl(null);
            } else {
                toast.error(result.data?.error || result.error || '提交失败');
            }
        } catch (_error) {
            toast.error('请求失败');
        } finally {
            // setIsLoading(false);
        }
    }

    const handleSignatureConfirm = (blob: Blob) => {
        // Convert blob to Data URL for storage (simulating upload for now)
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
            const base64data = reader.result as string;
            setSignatureUrl(base64data);
            handleConfirm(); // Auto submit after signature
        };
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setStep('CONFIRM');
                setSignatureUrl(null);
            }
        }}>
            <DialogTrigger asChild>
                {trigger || <Button>提交完工</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>确认提交完工申请？</DialogTitle>
                    <DialogDescription>
                        {step === 'CONFIRM'
                            ? "确认所有安装项已完成并拍摄照片后，点击下一步进行客户验收签字。"
                            : "请客户在下方区域签字确认验收。"}
                    </DialogDescription>
                </DialogHeader>

                {step === 'SIGN' && (
                    <div className="py-2">
                        <SignatureCanvas
                            onConfirm={handleSignatureConfirm}
                            onCancel={() => setStep('CONFIRM')}
                        />
                    </div>
                )}

                {step === 'CONFIRM' && (
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
                        <Button onClick={() => setStep('SIGN')}>
                            下一步 (客户签字)
                        </Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
