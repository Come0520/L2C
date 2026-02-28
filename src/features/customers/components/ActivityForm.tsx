'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { createActivity } from '@/features/customers/actions/activities';
import { toast } from 'sonner';
import Loader2 from 'lucide-react/dist/esm/icons/loader';
import Send from 'lucide-react/dist/esm/icons/send';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface Props {
  customerId: string;
  onSuccess: () => void;
}

/** 活动类型选项，与 activitySchema 中的 z.enum 对齐 */
type ActivityType = 'VISIT' | 'PHONE' | 'WECHAT' | 'OTHER';

const TYPES: { value: ActivityType; label: string }[] = [
  { value: 'PHONE', label: '电话沟通' },
  { value: 'WECHAT', label: '微信沟通' },
  { value: 'VISIT', label: '上门拜访' },
  { value: 'OTHER', label: '其他' },
];

/**
 * 跟进记录表单
 *
 * 提供跟踪方式下拉选择 + 内容输入 + 保存按钮的紧凑布局
 */
export function ActivityForm({ customerId, onSuccess }: Props) {
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActivityType>('PHONE');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const res = await createActivity({
        customerId,
        type,
        description,
      });

      if (res.success) {
        toast.success('跟进记录已保存');
        setDescription('');
        onSuccess();
      } else {
        toast.error(res.error || '保存失败');
      }
    } catch (_e) {
      toast.error('网络错误');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-muted/20 space-y-3 rounded-lg border p-4">
      <Textarea
        placeholder="记录跟进详情..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="bg-background min-h-[80px] resize-none focus:ring-1"
      />

      <div className="flex items-center justify-between">
        {/* 跟踪方式下拉选择 */}
        <Select value={type} onValueChange={(v) => setType(v as ActivityType)}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="跟踪方式" />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value} className="text-xs">
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !description.trim()}
          className="gap-2"
        >
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          保存记录
        </Button>
      </div>
    </div>
  );
}
