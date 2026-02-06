'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { MultiSelect } from '@/shared/ui/multi-select';
import { Loader2, Copy, Check, UserPlus } from 'lucide-react';
import { createEmployeeInviteLink } from '@/features/settings/actions/invite';

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [roles, setRoles] = useState<string[]>(['STAFF']);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      // 参数校验
      if (roles.length === 0) {
        alert('请至少选择一个角色');
        setLoading(false);
        return;
      }
      const result = await createEmployeeInviteLink(roles);
      if (result.success && result.link) {
        setInviteLink(result.link);
      } else {
        // simple alert for now, could be toast
        alert(result.error || '生成失败');
      }
    } catch (e) {
      console.error(e);
      alert('生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setInviteLink('');
          setCopied(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          邀请成员
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>邀请新成员</DialogTitle>
          <DialogDescription>
            生成邀请链接发送给新成员，对方点击链接即可注册加入企业。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>默认角色</Label>
            <MultiSelect
              options={[
                { label: '管理员 (ADMIN)', value: 'ADMIN' },
                { label: '经理 (MANAGER)', value: 'MANAGER' },
                { label: '销售 (SALES)', value: 'SALES' },
                { label: '财务 (FINANCE)', value: 'FINANCE' },
                { label: '供应链 (SUPPLY)', value: 'SUPPLY' },
                { label: '普通员工 (WORKER)', value: 'WORKER' },
                { label: '职员 (STAFF)', value: 'STAFF' },
                { label: '调度 (DISPATCHER)', value: 'DISPATCHER' },
                { label: '安装工 (INSTALLER)', value: 'INSTALLER' },
                { label: '测量员 (MEASURER)', value: 'MEASURER' },
              ]}
              selected={roles}
              onChange={setRoles}
              placeholder="选择角色..."
            />
          </div>

          {!inviteLink ? (
            <Button className="w-full" onClick={handleGenerateLink} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  正在生成...
                </>
              ) : (
                '生成邀请链接'
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>邀请链接 (7天有效)</Label>
              <div className="flex items-center space-x-2">
                <Input readOnly value={inviteLink} className="flex-1 font-mono text-sm" />
                <Button
                  size="sm"
                  className="px-3"
                  onClick={handleCopy}
                  variant={copied ? 'outline' : 'default'}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">请将此链接发送给新成员，点击即可注册。</p>
              <Button
                variant="ghost"
                className="mt-2 w-full text-xs text-slate-400"
                onClick={() => setInviteLink('')}
              >
                重新生成
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
