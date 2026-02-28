'use client';

/**
 * 新租户初始化引导向导（精确人数 × 模版选择制）
 *
 * 三步走：选人数 → 选模版 → 确认并去邀请
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  type TeamSizeValue,
  type ProfileTemplate,
  type TemplateDefinition,
  SIZE_OPTIONS,
  getTemplatesForSize,
  findTemplateById,
} from '@/features/settings/lib/onboarding-templates';
import { applyTemplate, skipOnboarding } from '@/features/settings/actions/onboarding-actions';
import { CheckCircle2, Loader2, ArrowLeft, Sparkles, UserPlus } from 'lucide-react';
import './onboarding-wizard.css';

// ============ 类型与常量 ============

type Step = 'size' | 'template' | 'confirm';

// ============ 主组件 ============

export default function OnboardingWizard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>('size');
  const [selectedSizeValue, setSelectedSizeValue] = useState<TeamSizeValue | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  /** 获取当前人数对应的模版列表 */
  const availableTemplates = selectedSizeValue ? getTemplatesForSize(selectedSizeValue) : [];

  /** 当前选中的人数选项 UI 数据 */
  const selectedSizeOption = SIZE_OPTIONS.find((o) => o.value === selectedSizeValue) ?? null;

  /** 步骤进度 */
  const stepIndex = step === 'size' ? 0 : step === 'template' ? 1 : 2;
  const totalSteps = 3;

  // ─── 处理人数选择 ───
  const handleSizeSelect = (sizeValue: TeamSizeValue) => {
    setSelectedSizeValue(sizeValue);
    setSelectedTemplate(null);
    setError('');

    const templates = getTemplatesForSize(sizeValue);

    // 只有一个模版时，直接跳到确认
    if (templates.length === 1) {
      setSelectedTemplate(templates[0]);
      setStep('confirm');
    } else {
      setStep('template');
    }
  };

  // ─── 处理模版选择 ───
  const handleTemplateSelect = (template: TemplateDefinition) => {
    setSelectedTemplate(template);
    setError('');
    setStep('confirm');
  };

  // ─── 返回上一步 ───
  const handleBack = () => {
    setError('');
    if (step === 'confirm') {
      const templates = selectedSizeValue ? getTemplatesForSize(selectedSizeValue) : [];
      if (templates.length <= 1) {
        // 只有一个模版的话，直接回到选规模
        setStep('size');
        setSelectedTemplate(null);
      } else {
        setStep('template');
      }
    } else if (step === 'template') {
      setStep('size');
      setSelectedSizeValue(null);
    }
  };

  // ─── 确认应用模版 ───
  const handleApply = () => {
    if (!selectedTemplate || !selectedSizeValue) return;

    startTransition(async () => {
      const result = await applyTemplate(
        selectedTemplate.id as ProfileTemplate,
        String(selectedSizeValue)
      );
      if (result.success) {
        setIsComplete(true);
        setTimeout(() => router.push('/settings/users'), 2200);
      } else {
        setError(result.error || '提交失败');
      }
    });
  };

  // ─── 跳过引导 ───
  const handleSkip = () => {
    startTransition(async () => {
      const result = await skipOnboarding();
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || '操作失败');
      }
    });
  };

  // ─── 完成动画 ───
  if (isComplete) {
    return (
      <div className="onboarding-complete">
        <div className="complete-animation">
          <Sparkles className="sparkle-icon" />
          <h2>配置完成！</h2>
          <p>正在为您跳转到团队邀请页面...</p>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-wizard">
      {/* 进度条 */}
      <div className="wizard-progress">
        <div
          className="wizard-progress-fill"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* 头部 */}
      <div className="wizard-header">
        <div className="wizard-logo">
          <Sparkles className="logo-icon" />
          <span>L2C</span>
        </div>
        <button className="skip-btn" onClick={handleSkip} disabled={isPending}>
          跳过，自行配置
        </button>
      </div>

      {/* 主内容 */}
      <div className="wizard-content">
        {/* Step 1: 选人数 */}
        {step === 'size' && (
          <div className="wizard-step">
            <h1 className="step-title">👋 欢迎入驻 L2C！</h1>
            <p className="step-subtitle">告诉我们团队人数，我们帮您配置最适合的工作模式</p>
            <div className="options-grid size-grid">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`option-card size-card ${selectedSizeValue === opt.value ? 'selected' : ''}`}
                  onClick={() => handleSizeSelect(opt.value)}
                >
                  <span className="option-icon">{opt.icon}</span>
                  <span className="option-label">{opt.label}</span>
                  <span className="option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: 选模版 */}
        {step === 'template' && (
          <div className="wizard-step">
            <h1 className="step-title">选择工作模式</h1>
            <p className="step-subtitle">
              {selectedSizeOption?.label} 的团队，以下哪种最贴合你们的日常？
            </p>
            <div className="options-list">
              {availableTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  className={`template-card ${selectedTemplate?.id === tpl.id ? 'selected' : ''}`}
                  onClick={() => handleTemplateSelect(tpl)}
                >
                  <div className="template-card-header">
                    <span className="template-icon">{tpl.icon}</span>
                    <div className="template-titles">
                      <span className="template-name">{tpl.name}</span>
                      <span className="template-tagline">{tpl.tagline}</span>
                    </div>
                  </div>
                  <p className="template-desc">{tpl.description}</p>
                  <div className="template-roles">
                    {tpl.roles.map((r, i) => (
                      <span key={i} className={`role-tag ${r.isBoss ? 'boss' : ''}`}>
                        {r.name}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: 确认 */}
        {step === 'confirm' && selectedTemplate && (
          <div className="wizard-step confirm-step">
            <div className="preview-badge">
              <Sparkles className="badge-icon" />
              {selectedTemplate.icon} {selectedTemplate.name}
            </div>
            <h1 className="step-title">确认您的配置</h1>
            <p className="step-subtitle">{selectedTemplate.description}</p>

            {/* 功能特征 */}
            <div className="preview-section">
              <h4>✨ 系统将为您配置</h4>
              <ul>
                {selectedTemplate.features.map((f, i) => (
                  <li key={i}>
                    <CheckCircle2 className="feature-icon enabled" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 角色清单 */}
            <div className="preview-section">
              <h4>👥 将预创建的角色</h4>
              <div className="role-tags">
                {selectedTemplate.roles.map((r, i) => (
                  <div key={i} className="role-detail">
                    <span className={`role-tag ${r.isBoss ? 'boss' : ''}`}>{r.name}</span>
                    <span className="role-desc">{r.description}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="confirm-hint">
              <UserPlus size={16} />
              <span>确认后，您将可以立即邀请同事加入对应角色</span>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && <div className="wizard-error">{error}</div>}
      </div>

      {/* 底部导航 */}
      <div className="wizard-footer">
        {step !== 'size' && (
          <button className="nav-btn back-btn" onClick={handleBack} disabled={isPending}>
            <ArrowLeft size={16} />
            上一步
          </button>
        )}
        <div className="footer-spacer" />

        {step === 'confirm' && (
          <div className="final-actions">
            <button className="nav-btn skip-config-btn" onClick={handleSkip} disabled={isPending}>
              我想自己从头配置
            </button>
            <button className="nav-btn apply-btn" onClick={handleApply} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="spinner" />
                  正在配置...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  确认，去邀请团队
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
