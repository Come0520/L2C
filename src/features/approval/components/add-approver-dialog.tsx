'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { UserPlus, Search, Loader2 } from 'lucide-react';
import { searchApprovers } from '../actions/approver-queries';
import { addApprover } from '../actions/processing';
import { toast } from 'sonner';
import { Badge } from '@/shared/ui/badge';

interface UserOption {
    id: string;
    name: string;
    role: string | null;
}

export function AddApproverDialog({ taskId, onComplete }: { taskId: string; onComplete?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<UserOption[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchApprovers(searchQuery);
            setUsers(results as UserOption[]);
        } catch (err: any) {
            toast.error(err.message || '搜索失败');
        } finally {
            setIsSearching(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedUserId) {
            toast.error('请选择审批人');
            return;
        }
        setIsSubmitting(true);
        try {
            const result = await addApprover({
                taskId,
                targetUserId: selectedUserId,
                comment
            });
            if (result.success) {
                toast.success('已发起加签协作');
                setIsOpen(false);
                onComplete?.();
            } else {
                toast.error(result.error || '加签失败');
            }
        } catch (err: any) {
            toast.error(err.message || '系统错误');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <UserPlus className="w-4 h-4" /> 邀请协作 (加签)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>邀请他人协作审批</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="输入姓名搜索..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button size="icon" onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="max-h-[200px] overflow-y-auto space-y-2 border rounded-md p-2">
                        {users.length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-8">
                                {isSearching ? '搜索中...' : '输入姓名并搜索'}
                            </p>
                        ) : (
                            users.map((u) => (
                                <div
                                    key={u.id}
                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedUserId === u.id ? 'bg-primary/10 border-primary border' : 'hover:bg-muted border border-transparent'}`}
                                    onClick={() => setSelectedUserId(u.id)}
                                >
                                    <div>
                                        <p className="text-sm font-medium">{u.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{u.role}</p>
                                    </div>
                                    {selectedUserId === u.id && <Badge variant="secondary">已选</Badge>}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">邀请说明 / 评审焦点</label>
                        <Textarea
                            placeholder="请说明希望对方重点评审的内容..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting || !selectedUserId}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认加签
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
