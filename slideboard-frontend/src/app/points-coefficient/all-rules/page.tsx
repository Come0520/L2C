'use client';

import { useState, useEffect, useCallback } from 'react';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { coefficientService } from '@/services/coefficient.client';
import { CoefficientRule } from '@/types/points';

/**
 * 全部规则页面(领导)
 */
export default function AllRulesPage() {
  const [rules, setRules] = useState<CoefficientRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coefficientService.getRules(
        statusFilter === 'all' ? undefined : statusFilter
      );
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      draft: { label: '草稿', color: 'bg-paper-ink-light text-paper-ink-secondary' },
      pending_approval: { label: '待审批', color: 'bg-paper-warning-light text-paper-warning' },
      approved: { label: '已批准', color: 'bg-paper-success-light text-paper-success' },
      rejected: { label: '已拒绝', color: 'bg-paper-error-light text-paper-error' },
      active: { label: '生效中', color: 'bg-paper-primary-light text-paper-primary' },
      expired: { label: '已过期', color: 'bg-paper-border text-paper-ink-secondary' },
    };

    const badge = (badges[status] ?? badges.draft) as { label: string; color: string };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  // 统计数据
  const stats = {
    total: rules.length,
    active: rules.filter(r => r.status === 'active').length,
    pending: rules.filter(r => r.status === 'pending_approval').length,
    approved: rules.filter(r => r.status === 'approved').length,
  };

  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-paper-ink">全部规则</h1>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <PaperCard>
            <PaperCardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-paper-ink">{stats.total}</div>
              <div className="text-sm text-paper-ink-secondary mt-1">全部规则</div>
            </PaperCardContent>
          </PaperCard>
          <PaperCard>
            <PaperCardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-paper-primary">{stats.active}</div>
              <div className="text-sm text-paper-ink-secondary mt-1">生效中</div>
            </PaperCardContent>
          </PaperCard>
          <PaperCard>
            <PaperCardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-paper-warning">{stats.pending}</div>
              <div className="text-sm text-paper-ink-secondary mt-1">待审批</div>
            </PaperCardContent>
          </PaperCard>
          <PaperCard>
            <PaperCardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-paper-success">{stats.approved}</div>
              <div className="text-sm text-paper-ink-secondary mt-1">已批准</div>
            </PaperCardContent>
          </PaperCard>
        </div>

        {/* 规则列表 */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>规则列表</PaperCardTitle>
            <div className="flex gap-2">
              <select
                className="px-3 py-2 border border-paper-border rounded-lg text-sm focus:outline-none focus:border-paper-primary"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">全部状态</option>
                <option value="active">生效中</option>
                <option value="approved">已批准</option>
                <option value="pending_approval">待审批</option>
                <option value="expired">已过期</option>
              </select>
            </div>
          </PaperCardHeader>
          <PaperCardContent>
            {loading ? (
              <div className="text-center py-12">加载中...</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-paper-ink-secondary">暂无规则</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-paper-border">
                    <tr className="text-left">
                      <th className="pb-3 font-medium text-paper-ink-secondary">规则名称</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">创建人</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">产品品类</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">地区</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">最终系数</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">生效时间</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-paper-border hover:bg-paper-background">
                        <td className="py-4">
                          <div className="font-medium text-paper-ink">{rule.rule_name}</div>
                          <div className="text-xs text-paper-ink-secondary">{rule.rule_code}</div>
                        </td>
                        <td className="py-4 text-sm text-paper-ink-secondary">
                          {rule.created_by.substring(0, 8)}...
                        </td>
                        <td className="py-4 text-sm">
                          {rule.product_category || '全部'}
                          {rule.product_model && (
                            <div className="text-xs text-paper-ink-secondary">
                              {rule.product_model}
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-sm">
                          {rule.region_code || '全国'}
                        </td>
                        <td className="py-4">
                          <div className="font-bold text-paper-primary">
                            {(rule.final_coefficient * 100).toFixed(2)}%
                          </div>
                          <div className="text-xs text-paper-ink-secondary">
                            {(rule.base_coefficient * 100).toFixed(2)}% × {rule.time_coefficient}
                          </div>
                        </td>
                        <td className="py-4 text-sm">
                          <div>{new Date(rule.start_time).toLocaleDateString()}</div>
                          <div className="text-xs text-paper-ink-secondary">
                            至 {new Date(rule.end_time).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-4">
                          {getStatusBadge(rule.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PaperCardContent>
        </PaperCard>
      </div>
  );
}
