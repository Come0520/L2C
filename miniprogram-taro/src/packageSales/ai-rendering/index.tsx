/**
 * AI 效果图 4 步向导主页面
 *
 * 流程：Step 1 选面料 → Step 2 标注位置 → Step 3 选款式 → Step 4 生成效果图
 * 状态通过 useState 在主页面管理，子组件通过 Props 接收
 */
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useCallback } from 'react';
import { StepFabric } from './components/step-fabric';
import { StepMask } from './components/step-mask';
import { StepStyle } from './components/step-style';
import { StepGenerate } from './components/step-generate';
import './index.scss';

/** 4 步向导步骤枚举 */
type WizardStep = 'fabric' | 'mask' | 'style' | 'generate';

/** 向导状态（跨步骤共享） */
interface WizardState {
    /** Step 1: 面料来源 */
    fabricSource: 'showroom' | 'upload';
    /** Step 1: 面料图片 Base64 */
    fabricImageBase64: string | null;
    /** Step 1: 面料描述（文字） */
    fabricDescription: string;
    /** Step 2: 原始室内照片 Base64 */
    originalImageBase64: string | null;
    /** Step 2: 用户备注 */
    userNotes: string;
    /** Step 3: 选中的款式 ID */
    curtainStyleId: string;
    /** Step 3: 款式名称（显示用） */
    curtainStyleName: string;
}

const STEP_LIST: { id: WizardStep; label: string }[] = [
    { id: 'fabric', label: '选面料' },
    { id: 'mask', label: '标注' },
    { id: 'style', label: '选款式' },
    { id: 'generate', label: '生成' },
];

const INITIAL_STATE: WizardState = {
    fabricSource: 'showroom',
    fabricImageBase64: null,
    fabricDescription: '',
    originalImageBase64: null,
    userNotes: '',
    curtainStyleId: '',
    curtainStyleName: '',
};

export default function AiRenderingPage() {
    const [currentStep, setCurrentStep] = useState<WizardStep>('fabric');
    const [wizardState, setWizardState] = useState<WizardState>(INITIAL_STATE);

    /** 更新向导状态的辅助函数 */
    const updateState = useCallback((patch: Partial<WizardState>) => {
        setWizardState((prev) => ({ ...prev, ...patch }));
    }, []);

    /** 前进到下一步 */
    const goNext = useCallback(
        (step: WizardStep) => {
            setCurrentStep(step);
        },
        []
    );

    /** 返回上一步 */
    const goBack = useCallback(() => {
        const stepOrder: WizardStep[] = ['fabric', 'mask', 'style', 'generate'];
        const idx = stepOrder.indexOf(currentStep);
        if (idx > 0) {
            setCurrentStep(stepOrder[idx - 1]);
        } else {
            Taro.navigateBack();
        }
    }, [currentStep]);

    /** 当前步骤序号（1-based，用于进度条） */
    const currentStepIdx = STEP_LIST.findIndex((s) => s.id === currentStep);

    return (
        <View className="ai-rendering-page">
            {/* 顶部进度条 */}
            <View className="step-bar">
                {STEP_LIST.map((step, idx) => (
                    <View
                        key={step.id}
                        className={`step-item ${idx === currentStepIdx ? 'active' : ''} ${idx < currentStepIdx ? 'done' : ''}`}
                    >
                        <View className="step-dot">
                            {idx < currentStepIdx ? <Text className="check">✓</Text> : <Text>{idx + 1}</Text>}
                        </View>
                        <Text className="step-label">{step.label}</Text>
                    </View>
                ))}
                {/* 连接线 */}
                <View className="step-lines">
                    {STEP_LIST.slice(0, -1).map((_, idx) => (
                        <View
                            key={idx}
                            className={`step-line ${idx < currentStepIdx ? 'active' : ''}`}
                        />
                    ))}
                </View>
            </View>

            {/* 各步骤内容区 */}
            <View className="step-content">
                {currentStep === 'fabric' && (
                    <StepFabric
                        value={{
                            fabricSource: wizardState.fabricSource,
                            fabricImageBase64: wizardState.fabricImageBase64,
                            fabricDescription: wizardState.fabricDescription,
                        }}
                        onChange={(patch) => updateState(patch)}
                        onNext={() => goNext('mask')}
                        onBack={goBack}
                    />
                )}

                {currentStep === 'mask' && (
                    <StepMask
                        value={{
                            originalImageBase64: wizardState.originalImageBase64,
                            userNotes: wizardState.userNotes,
                        }}
                        onChange={(patch) => updateState(patch)}
                        onNext={() => goNext('style')}
                        onBack={goBack}
                    />
                )}

                {currentStep === 'style' && (
                    <StepStyle
                        value={{
                            curtainStyleId: wizardState.curtainStyleId,
                            curtainStyleName: wizardState.curtainStyleName,
                        }}
                        onChange={(patch) => updateState(patch)}
                        onNext={() => goNext('generate')}
                        onBack={goBack}
                    />
                )}

                {currentStep === 'generate' && (
                    <StepGenerate
                        wizardState={wizardState}
                        onBack={goBack}
                        onRestart={() => {
                            // 重置向导
                            setWizardState(INITIAL_STATE);
                            setCurrentStep('fabric');
                        }}
                    />
                )}
            </View>
        </View>
    );
}
