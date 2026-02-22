'use client';
import { logger } from '@/shared/lib/logger';

import { useState, useEffect } from 'react';
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
import { RoleSelector } from './role-selector';
import { Loader2, Copy, Check, UserPlus } from 'lucide-react';
import { createEmployeeInviteLink } from '@/features/settings/actions/invite';
import { getAvailableRoles } from '@/features/settings/actions/roles';

interface InviteUserDialogProps {
  availableRoles?: { label: string; value: string }[];
}

export function InviteUserDialog({ availableRoles }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [roles, setRoles] = useState<string[]>(['STAFF']);
  const [roleOptions, setRoleOptions] = useState<{ label: string; value: string }[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      if (availableRoles && availableRoles.length > 0) {
        setRoleOptions(availableRoles);
      } else {
        setLoadingRoles(true);
        getAvailableRoles()
          .then((options) => {
            setRoleOptions(options);
          })
          .catch((err) => {
            logger.error('Failed to load roles:', err);
          })
          .finally(() => {
            setLoadingRoles(false);
          });
      }
    }
  }, [open, availableRoles]);

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
      logger.error(e);
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
            {loadingRoles ? (
              <div className="text-muted-foreground flex items-center space-x-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>加载角色中...</span>
              </div>
            ) : (
              <RoleSelector
                options={roleOptions}
                selected={roles}
                onSelect={setRoles}
              />
            )}
          </div>

          {!inviteLink ? (
            <Button
              className="w-full"
              onClick={handleGenerateLink}
              disabled={loading || loadingRoles}
            >
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
