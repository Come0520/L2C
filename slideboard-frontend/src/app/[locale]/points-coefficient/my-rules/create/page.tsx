'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import DashboardLayout from '@/components/layout/dashboard-layout';
import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { PaperInput } from '@/components/ui/paper-input';
import { coefficientService } from '@/services/coefficient.client';
import { CreateCoefficientRuleParams } from '@/types/points';

/**
 * 创建系数规则页面
 */
export default function CreateRulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState<CreateCoefficientRuleParams>({
    rule_name: '',
    description: '',
    product_category: '',
    product_model: '',
    region_code: '',
    store_id: '',
    base_coefficient: 0.008, // 默认0.8%
    time_coefficient: 1.0,
    start_time: '',
    end_time: ''
  });

  const handleSubmit = async (saveAsDraft: boolean) => {
    // 验证
    if (!formData.rule_name) {
      alert('请输入规则名称');
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      alert('请选择生效时间');
      return;
    }

    if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      alert('结束时间必须晚于开始时间');
      return;
    }

    try {
      setLoading(true);
      
      // 创建规则
      const rule = await coefficientService.createRule(formData);

      if (saveAsDraft) {
        alert('保存成功');
        router.push('/points-coefficient/my-rules');
      } else {
        // 创建审批单
        await coefficientService.createApproval({
          title: `系数调整申请: ${formData.rule_name}`,
          reason: formData.description || '系数调整',
          rule_ids: [rule.id]
        });

        alert('提交成功,等待审批');
        router.push('/points-coefficient/my-approvals');
      }
    } catch (err: any) {
      alert(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const finalCoefficient = formData.base_coefficient * formData.time_coefficient;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center gap-4">
          <PaperButton
            variant="ghost"
            size="sm"
            onClick={() => router.push('/points-coefficient/my-rules')}
          >
            ← 返回
          </PaperButton>
          <h1 className="text-3xl font-bold text-paper-ink">新建系数规则</h1>
        </div>

        {/* 表单 */}
        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>基本信息</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <PaperInput
              label="规则名称"
              placeholder="如: 北京窗帘旺季促销"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-paper-ink mb-1">
                规则说明
              </label>
              <textarea
                className="w-full px-3 py-2 border border-paper-border rounded-lg focus:outline-none focus:border-paper-primary"
                rows={3}
                placeholder="说明此次系数调整的原因和目的"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>适用范围</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-paper-ink mb-1">
                  产品品类
                </label>
                <select
                  className="w-full px-3 py-2 border border-paper-border rounded-lg focus:outline-none focus:border-paper-primary"
                  value={formData.product_category}
                  onChange={(e) => setFormData({ ...formData, product_category: e.target.value })}
                >
                  <option value="">全部品类</option>
                  <option value="curtain">窗帘</option>
                  <option value="wallpaper">墙纸</option>
                  <option value="wallcard">墙咔</option>
                </select>
              </div>

              <PaperInput
                label="产品型号(可选)"
                placeholder="留空则适用全品类"
                value={formData.product_model}
                onChange={(e) => setFormData({ ...formData, product_model: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <PaperInput
                label="地区代码"
                placeholder="如: BJ, SH, 留空为全国"
                value={formData.region_code}
                onChange={(e) => setFormData({ ...formData, region_code: e.target.value })}
              />

              <PaperInput
                label="门店ID(可选)"
                placeholder="留空则适用全地区"
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
              />
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>系数设置</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-paper-ink mb-1">
                  基础系数(%)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  className="w-full px-3 py-2 border border-paper-border rounded-lg focus:outline-none focus:border-paper-primary"
                  value={(formData.base_coefficient * 100).toFixed(2)}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    base_coefficient: parseFloat(e.target.value) / 100 
                  })}
                />
                <p className="text-xs text-paper-ink-secondary mt-1">
                  订单金额的百分比,如0.8%表示每100元获得0.8分
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-paper-ink mb-1">
                  时间系数
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full px-3 py-2 border border-paper-border rounded-lg focus:outline-none focus:border-paper-primary"
                  value={formData.time_coefficient}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    time_coefficient: parseFloat(e.target.value) 
                  })}
                 />
                <p className="text-xs text-paper-ink-secondary mt-1">
                  促销倍数,如1.2表示旺季1.2倍
                </p>
              </div>
            </div>

            <div className="bg-paper-primary-light p-4 rounded-lg">
              <div className="text-sm text-paper-ink-secondary mb-1">最终系数</div>
              <div className="text-3xl font-bold text-paper-primary">
                {(finalCoefficient * 100).toFixed(4)}%
              </div>
              <div className="text-xs text-paper-ink-secondary mt-2">
                = {(formData.base_coefficient * 100).toFixed(2)}% × {formData.time_coefficient}
              </div>
              <div className="text-xs text-paper-ink-secondary mt-1">
                示例: ¥10,000订单 → {Math.floor(10000 * finalCoefficient)}积分
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        <PaperCard>
          <PaperCardHeader>
            <PaperCardTitle>生效时间</PaperCardTitle>
          </PaperCardHeader>
          <PaperCardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-paper-ink mb-1">
                  开始时间
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-paper-border rounded-lg focus:outline-none focus:border-paper-primary"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-paper-ink mb-1">
                  结束时间
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-paper-border rounded-lg focus:outline-none focus:border-paper-primary"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
          </PaperCardContent>
        </PaperCard>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-end">
          <PaperButton
            variant="outline"
            onClick={() => router.push('/points-coefficient/my-rules')}
            disabled={loading}
          >
            取消
          </PaperButton>
          <PaperButton
            variant="outline"
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            保存草稿
          </PaperButton>
          <PaperButton
            variant="primary"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            {loading ? '提交中...' : '提交审批'}
          </PaperButton>
        </div>
      </div>
    </DashboardLayout>
  );
}
