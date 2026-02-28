'use client';

import { useState } from 'react';
import { updateSalesTarget } from '@/features/sales/actions/targets';
import {
  updateAnnualTarget,
  splitAnnualToMonthly,
  AnnualTargetDTO,
} from '@/features/sales/actions/annual-targets';
import { updateWeeklyTarget, WeeklyTargetDTO } from '@/features/sales/actions/weekly-targets';
import { SalesTargetDTO } from '@/features/sales/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';
import { AlertTriangle, ArrowDownToLine } from 'lucide-react';

interface TargetsClientPageProps {
  initialTargets: SalesTargetDTO[];
  initialAnnualTargets: AnnualTargetDTO[];
  initialWeeklyTargets: WeeklyTargetDTO[];
  initialYear: number;
  initialMonth: number;
  initialWeek: number;
}

// ==================== 工具函数 ====================

function getRateColor(rate: number): string {
  if (rate >= 100) return 'text-emerald-600';
  if (rate >= 80) return 'text-blue-600';
  if (rate >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function formatAmount(amount: number): string {
  if (amount >= 10000) return `${(amount / 10000).toFixed(1)}万`;
  return amount.toLocaleString();
}

/**
 * 获取年份的周数列表 (1-53) - 为了简单，取固定 52 周，实际如果需要精确可以计算该年有几周
 */
const WEEKS = Array.from({ length: 53 }).map((_, i) => String(i + 1));

// ==================== 主组件 ====================

export function TargetsClientPage({
  initialTargets,
  initialAnnualTargets,
  initialWeeklyTargets,
  initialYear,
  initialMonth,
  initialWeek,
}: TargetsClientPageProps) {
  const router = useRouter();
  const [year, setYear] = useState(String(initialYear));
  const [month, setMonth] = useState(String(initialMonth));
  const [week, setWeek] = useState(String(initialWeek));
  const [loading, setLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [activeTab, setActiveTab] = useState<string>('monthly');

  // ==================== 日期选择 ====================
  const handleDateChange = (newYear: string, newMonth: string, newWeek: string) => {
    setYear(newYear);
    setMonth(newMonth);
    setWeek(newWeek);
    router.push(`/settings/sales/targets?year=${newYear}&month=${newMonth}&week=${newWeek}`);
  };

  // ==================== 编辑通用函数 ====================
  const handleEdit = (userId: string, amount: number) => {
    setEditingId(userId);
    setEditAmount(String(amount));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditAmount('');
  };

  // ==================== 月度目标保存 ====================
  const handleSaveMonthly = async (userId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('请输入有效金额');
      return;
    }

    setLoading(userId);
    try {
      const res = await updateSalesTarget(userId, parseInt(year), parseInt(month), amount);
      if (res.success) {
        toast.success('设置成功');
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(res.error || '设置失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(null);
    }
  };

  // ==================== 周度目标保存 ====================
  const handleSaveWeekly = async (userId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('请输入有效金额');
      return;
    }

    setLoading(userId);
    try {
      const res = await updateWeeklyTarget(userId, parseInt(year), parseInt(week), amount);
      if (res.success) {
        toast.success('周目标设置成功');
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(res.error || '设置失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(null);
    }
  };

  // ==================== 年度目标编辑 ====================
  const handleSaveAnnual = async (userId: string) => {
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('请输入有效金额');
      return;
    }

    setLoading(userId);
    try {
      const res = await updateAnnualTarget(userId, parseInt(year), amount);
      if (res.success) {
        toast.success('年度目标设置成功');
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(res.error || '设置失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(null);
    }
  };

  // ==================== 一键拆解 ====================
  const handleSplit = async (userId: string) => {
    setLoading(userId + '_split');
    try {
      const res = await splitAnnualToMonthly(userId, parseInt(year));
      if (res.success) {
        toast.success('已将年度目标均分到12个月');
        router.refresh();
      } else {
        toast.error(res.error || '拆解失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setLoading(null);
    }
  };

  // ==================== 计算汇总 ====================
  const calcTotals = (list: any[]) => {
    const target = list.reduce((s, i) => s + (i.targetAmount || 0), 0);
    const achieved = list.reduce((s, i) => s + (i.achievedAmount || 0), 0);
    const rate = target > 0 ? Math.round((achieved / target) * 1000) / 10 : 0;
    return { target, achieved, rate };
  };

  const monthlyTotals = calcTotals(initialTargets);
  const weeklyTotals = calcTotals(initialWeeklyTargets);
  const totalAnnual = initialAnnualTargets.reduce((s, i) => s + i.targetAmount, 0);

  // 一致性校验：12个月合计 vs 年度目标
  const hasInconsistency = initialAnnualTargets.some((a) => a.targetAmount > 0 && !a.isConsistent);

  return (
    <div className="space-y-4">
      {/* 年份选择 始终显示 */}
      <div className="bg-card flex items-center gap-4 rounded-lg border p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">年份</span>
          <Select value={year} onValueChange={(val) => handleDateChange(val, month, week)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }).map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return (
                  <SelectItem key={y} value={String(y)}>
                    {y}年
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 一致性提醒 Banner */}
      {hasInconsistency && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>目标一致性提醒：</strong>部分销售人员的12个月目标合计与年度目标存在差异，
            请确认是否需要调整。这不影响目标设定，仅作为友好提醒。
          </span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="weekly">📅 周目标</TabsTrigger>
          <TabsTrigger value="monthly">📅 月度目标</TabsTrigger>
          <TabsTrigger value="annual">📊 年度目标</TabsTrigger>
        </TabsList>

        {/* ==================== 周度目标 Tab ==================== */}
        <TabsContent value="weekly" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">周数 (ISO)</span>
              <Select value={week} onValueChange={(val) => handleDateChange(year, month, val)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKS.map((w) => (
                    <SelectItem key={w} value={w}>
                      第 {w} 周
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                总目标:{' '}
                <span className="text-primary ml-1 text-lg font-medium">
                  ¥{formatAmount(weeklyTotals.target)}
                </span>
              </div>
              <div>
                已完成:{' '}
                <span className="ml-1 text-lg font-medium text-emerald-600">
                  ¥{formatAmount(weeklyTotals.achieved)}
                </span>
              </div>
              <div>
                达成率:{' '}
                <span className={cn('ml-1 text-lg font-bold', getRateColor(weeklyTotals.rate))}>
                  {weeklyTotals.rate}%
                </span>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>销售人员</TableHead>
                    <TableHead className="text-right">目标金额 (¥)</TableHead>
                    <TableHead className="text-right">已完成 (¥)</TableHead>
                    <TableHead className="text-right">达成率</TableHead>
                    <TableHead className="w-[150px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialWeeklyTargets.map((item) => (
                    <TableRow key={item.userId}>
                      <TableCell className="font-medium">{item.userName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {editingId === item.userId && activeTab === 'weekly' ? (
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="ml-auto h-8 w-32 text-right"
                            autoFocus
                          />
                        ) : (
                          item.targetAmount.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {formatAmount(item.achievedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-semibold', getRateColor(item.completionRate))}>
                          {item.completionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.userId && activeTab === 'weekly' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                              disabled={!!loading}
                            >
                              取消
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveWeekly(item.userId)}
                              disabled={!!loading}
                            >
                              保存
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item.userId, item.targetAmount)}
                          >
                            设置
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {initialWeeklyTargets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                        暂无销售人员
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 月度目标 Tab ==================== */}
        <TabsContent value="monthly" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">月份</span>
              <Select value={month} onValueChange={(val) => handleDateChange(year, val, week)}>
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {i + 1}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                总目标:{' '}
                <span className="text-primary ml-1 text-lg font-medium">
                  ¥{formatAmount(monthlyTotals.target)}
                </span>
              </div>
              <div>
                已完成:{' '}
                <span className="ml-1 text-lg font-medium text-emerald-600">
                  ¥{formatAmount(monthlyTotals.achieved)}
                </span>
              </div>
              <div>
                达成率:{' '}
                <span className={cn('ml-1 text-lg font-bold', getRateColor(monthlyTotals.rate))}>
                  {monthlyTotals.rate}%
                </span>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>销售人员</TableHead>
                    <TableHead className="text-right">目标金额 (¥)</TableHead>
                    <TableHead className="text-right">已完成 (¥)</TableHead>
                    <TableHead className="text-right">达成率</TableHead>
                    <TableHead className="w-[150px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialTargets.map((item) => (
                    <TableRow key={item.userId}>
                      <TableCell className="font-medium">{item.userName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {editingId === item.userId && activeTab === 'monthly' ? (
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="ml-auto h-8 w-32 text-right"
                            autoFocus
                          />
                        ) : (
                          item.targetAmount.toLocaleString()
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600">
                        {formatAmount(item.achievedAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-semibold', getRateColor(item.completionRate))}>
                          {item.completionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.userId && activeTab === 'monthly' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                              disabled={!!loading}
                            >
                              取消
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveMonthly(item.userId)}
                              disabled={!!loading}
                            >
                              保存
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item.userId, item.targetAmount)}
                          >
                            设置
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {initialTargets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                        暂无销售人员
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== 年度目标 Tab ==================== */}
        <TabsContent value="annual" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              设置 <span className="text-foreground font-medium">{year}年</span>{' '}
              年度总体目标，可一键拆解到12个月
            </div>
            <div className="text-sm">
              年度目标合计:{' '}
              <span className="text-primary ml-1 text-lg font-medium">
                ¥{formatAmount(totalAnnual)}
              </span>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>销售人员</TableHead>
                    <TableHead className="text-right">年度目标 (¥)</TableHead>
                    <TableHead className="text-right">月目标合计 (¥)</TableHead>
                    <TableHead className="text-right">一致性</TableHead>
                    <TableHead className="w-[220px] text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialAnnualTargets.map((item) => (
                    <TableRow key={item.userId}>
                      <TableCell className="font-medium">{item.userName}</TableCell>
                      <TableCell className="text-right font-mono">
                        {editingId === item.userId && activeTab === 'annual' ? (
                          <Input
                            type="number"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="ml-auto h-8 w-32 text-right"
                            autoFocus
                          />
                        ) : item.targetAmount > 0 ? (
                          formatAmount(item.targetAmount)
                        ) : (
                          <span className="text-muted-foreground">未设置</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.monthlySum > 0 ? (
                          formatAmount(item.monthlySum)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.targetAmount > 0 ? (
                          item.isConsistent ? (
                            <span className="text-sm text-emerald-600">✅ 一致</span>
                          ) : (
                            <span className="flex items-center justify-end gap-1 text-sm text-amber-600">
                              <AlertTriangle className="h-3 w-3" />
                              差异 ¥{formatAmount(Math.abs(item.difference))}
                            </span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === item.userId && activeTab === 'annual' ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancel}
                              disabled={!!loading}
                            >
                              取消
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSaveAnnual(item.userId)}
                              disabled={!!loading}
                            >
                              保存
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(item.userId, item.targetAmount)}
                            >
                              {item.targetAmount > 0 ? '修改' : '设置'}
                            </Button>
                            {item.targetAmount > 0 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleSplit(item.userId)}
                                disabled={loading === item.userId + '_split'}
                              >
                                <ArrowDownToLine className="mr-1 h-3 w-3" />
                                拆解到月
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {initialAnnualTargets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                        暂无销售人员
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
