'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { coefficientService } from '@/services/coefficient.client';
import { CoefficientRule } from '@/types/points';

/**
 * 我的系数规则页面(销售负责人)
 */
export default function MyRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<CoefficientRule[]>([]);
  const [loading, setLoading] = useState(true);

  

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await coefficientService.getMyRules();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条规则吗?')) return;

    try {
      await coefficientService.deleteRule(id);
      alert('删除成功');
      loadRules();
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      draft: { label: '草稿', color: 'bg-paper-ink-light text-paper-ink-secondary' },
      pending_approval: { label: '待审批', color: 'bg-paper-warning-light text-paper-warning' },
      approved: { label: '已批准', color: 'bg-paper-success-light text-paper-success' },
      rejected: { label: '已拒绝', color: 'bg-paper-error-light text-paper-error' },
      active: { label: '生效中', color: 'bg-paper-primary-light text-paper-primary' },
      expired: { label: '已过期', color: 'bg-paper-border text-paper-ink-secondary' },
    };

    const badge = (badges[status] || badges.draft) as { label: string; color: string };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-paper-ink">我的系数规则</h1>
          <PaperButton
            variant="primary"
            onClick={() => router.push('/points-coefficient/my-rules/create')}
          >
            + 新建规则
          </PaperButton>
        </div>

        {/* 规则列表 */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>规则列表</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent>
            {loading ? (
              <div className="text-center py-12 text-paper-ink-secondary">
                加载中...
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📊</div>
                <p className="text-paper-ink-secondary mb-4">还没有创建任何规则</p>
                <PaperButton
                  variant="primary"
                  onClick={() => router.push('/points-coefficient/my-rules/create')}
                >
                  创建第一条规则
                </PaperButton>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-paper-border">
                    <tr className="text-left">
                      <th className="pb-3 font-medium text-paper-ink-secondary">规则名称</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">产品品类</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">地区</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">系数</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">生效时间</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">状态</th>
                      <th className="pb-3 font-medium text-paper-ink-secondary">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule.id} className="border-b border-paper-border hover:bg-paper-background">
                        <td className="py-4">
                          <div className="font-medium text-paper-ink">{rule.rule_name}</div>
                          <div className="text-xs text-paper-ink-secondary">{rule.rule_code}</div>
                        </td>
                        <td className="py-4 text-sm">
                          {rule.product_category || '-'}
                          {rule.product_model && (
                            <div className="text-xs text-paper-ink-secondary">
                              型号: {rule.product_model}
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-sm">
                          {rule.region_code || '全国'}
                        </td>
                        <td className="py-4">
                          <div className="text-sm">
                            <span className="font-bold text-paper-primary">
                              {(rule.final_coefficient * 100).toFixed(2)}%
                            </span>
                          </div>
                          <div className="text-xs text-paper-ink-secondary">
                            基础{(rule.base_coefficient * 100).toFixed(2)}% × 时间{rule.time_coefficient}
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
                        <td className="py-4">
                          <div className="flex gap-2">
                            {rule.status === 'draft' && (
                              <>
                                <PaperButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => router.push(`/points-coefficient/my-rules/edit/${rule.id}`)}
                                >
                                  编辑
                                </PaperButton>
                                <PaperButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(rule.id)}
                                >
                                  删除
                                </PaperButton>
                              </>
                            )}
                            <PaperButton
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/points-coefficient/my-rules/${rule.id}`)}
                            >
                              查看
                            </PaperButton>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PaperCardContent>
        </PaperCard>

        {/* 说明 */}
        <PaperCard className="bg-paper-info-light">
          <PaperCardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">ℹ️</span>
              <div className="flex-1">
                <h3 className="font-medium text-paper-ink mb-2">规则说明</h3>
                <ul className="text-sm text-paper-ink-secondary space-y-1">
                  <li>• 草稿状态的规则可以编辑和删除</li>
                  <li>• 提交审批后需要渠道负责人和领导依次批准</li>
                  <li>• 批准的规则会在设定的时间自动生效</li>
                  <li>• 最终系数 = 基础系数 × 时间系数</li>
                </ul>
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>
      </div>
    </DashboardLayout>
  );
}
