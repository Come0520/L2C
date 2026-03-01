'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import Truck from 'lucide-react/dist/esm/icons/truck';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import PenLine from 'lucide-react/dist/esm/icons/pen-line';
import { toast } from 'sonner';
import { updateLogistics } from '@/features/orders/actions';
import { format } from 'date-fns';

interface LogisticsTrace {
  time?: string;
  ftime?: string;
  content?: string;
  context?: string;
}

interface LogisticsData {
  company?: string;
  trackingNo?: string;
  status?: string;
  traces?: LogisticsTrace[];
  lastUpdatedAt?: string;
}

interface LogisticsCardProps {
  orderId: string;
  version: number;
  logistics: LogisticsData; // OrderLogisticsData
}

export function LogisticsCard({ orderId, version, logistics }: LogisticsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [company, setCompany] = useState(logistics?.company || 'shunfeng');
  const [trackingNo, setTrackingNo] = useState(logistics?.trackingNo || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!trackingNo) return toast.error('请输入运单号');

    setLoading(true);
    try {
      const res = await updateLogistics({ orderId, company, trackingNo, version });
      if (res.success) {
        toast.success('物流信息已更新');
        setIsEditing(false);
        // In a real app, we might need router.refresh() here to re-fetch data
        window.location.reload();
      } else {
        toast.error('更新失败: ' + res.error);
      }
    } catch {
      toast.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (!logistics && !isEditing) {
    return (
      <Card className="border-border glass-panel shadow-sm">
        <CardHeader className="border-border flex flex-row items-center justify-between border-b pb-3">
          <h3 className="text-md flex items-center gap-2 font-semibold">
            <Truck className="text-muted-foreground h-4 w-4" />
            物流信息
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <PenLine className="mr-1 h-3 w-3" /> 录入
          </Button>
        </CardHeader>
        <CardContent className="py-8 pt-4 text-center text-sm text-slate-400">
          暂无物流信息
        </CardContent>
      </Card>
    );
  }

  if (isEditing) {
    return (
      <Card className="border-border glass-panel shadow-sm">
        <CardHeader className="border-border border-b pb-3">
          <h3 className="text-md flex items-center gap-2 font-semibold">
            <Truck className="text-muted-foreground h-4 w-4" />
            录入物流
          </h3>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">快递公司</label>
            <Select value={company} onValueChange={setCompany}>
              <SelectTrigger>
                <SelectValue placeholder="选择快递" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shunfeng">顺丰速运</SelectItem>
                <SelectItem value="yuantong">圆通速递</SelectItem>
                <SelectItem value="zhongtong">中通快递</SelectItem>
                <SelectItem value="yunda">韵达快递</SelectItem>
                <SelectItem value="deppon">德邦快递</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500">运单号</label>
            <Input
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="输入运单号"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleUpdate} disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border glass-panel shadow-sm">
      <CardHeader className="border-border flex flex-row items-center justify-between border-b pb-3">
        <h3 className="text-md flex items-center gap-2 font-semibold">
          <Truck className="text-muted-foreground h-4 w-4" />
          物流跟踪
        </h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={handleUpdate} title="刷新轨迹">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} title="修改单号">
            <PenLine className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="bg-muted/10 flex items-center justify-between rounded p-2 text-sm">
          <div>
            <span className="text-muted-foreground mr-2">单号:</span>
            <span className="font-mono font-medium">{logistics.trackingNo}</span>
          </div>
          <div className="text-foreground font-medium">
            {logistics.company === 'shunfeng' ? '顺丰' : logistics.company}
          </div>
        </div>

        {/* Timeline */}
        <div className="border-border relative ml-2 space-y-6 border-l py-2 pl-4">
          {(logistics.traces || []).map((trace: LogisticsTrace, idx: number) => (
            <div key={idx} className="relative">
              <div
                className={`border-background absolute top-1.5 -left-[21px] h-3 w-3 rounded-full border-2 ${idx === 0 ? 'bg-primary' : 'bg-muted'}`}
              />
              <div className="text-muted-foreground mb-0.5 text-xs">
                {trace.time || trace.ftime}
              </div>
              <div
                className={`text-sm ${idx === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
              >
                {trace.context}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right text-[10px] text-slate-300">
          Updated:{' '}
          {logistics.lastUpdatedAt ? format(new Date(logistics.lastUpdatedAt), 'MM-dd HH:mm') : '-'}
        </div>
      </CardContent>
    </Card>
  );
}
