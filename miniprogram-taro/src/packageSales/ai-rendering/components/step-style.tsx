/**
 * Step 3 — 选款式
 * 3x3 网格展示 Gemini client 中预设的 10 种窗帘款式
 * 选中后高亮显示并允许进入第 4 步
 */
import { View, Text, Image } from '@tarojs/components';

/** 预设款式列表（与 gemini-client.ts 的 CURTAIN_STYLE_PROMPT_MAP 对应） */
const PRESET_STYLES: { id: string; name: string; icon: string; category: string }[] = [
    { id: 'track_double', name: '轨道双开帘', icon: '🪟', category: '轨道帘' },
    { id: 'track_single_sheer', name: '轨道纱帘', icon: '💫', category: '轨道帘' },
    { id: 'roman_pole_ripple', name: '罗马杆皱褶帘', icon: '🎭', category: '罗马杆' },
    { id: 'roman_pole_wave', name: '罗马杆波浪帘', icon: '🌊', category: '罗马杆' },
    { id: 'roman_blind_flat', name: '平拉罗马帘', icon: '📋', category: '罗马帘' },
    { id: 'roman_blind_cascade', name: '瀑布罗马帘', icon: '💧', category: '罗马帘' },
    { id: 'roller_blackout', name: '遮光卷帘', icon: '🌑', category: '卷帘' },
    { id: 'roller_semi', name: '半遮光卷帘', icon: '🌓', category: '卷帘' },
    { id: 'venetian_wood', name: '木百叶帘', icon: '🏗️', category: '百叶帘' },
    { id: 'venetian_aluminum', name: '铝合金百叶帘', icon: '⚙️', category: '百叶帘' },
];

interface StepStyleValue {
    curtainStyleId: string;
    curtainStyleName: string;
}

interface StepStyleProps {
    value: StepStyleValue;
    onChange: (patch: Partial<StepStyleValue>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function StepStyle({ value, onChange, onNext, onBack }: StepStyleProps) {
    const handleSelect = (style: (typeof PRESET_STYLES)[0]) => {
        onChange({ curtainStyleId: style.id, curtainStyleName: style.name });
    };

    const canProceed = !!value.curtainStyleId;

    return (
        <View className="step-style">
            <Text className="step-title">第 3 步：选择窗帘款式</Text>
            <Text className="step-desc">选择一种窗帘安装方式</Text>

            {/* 款式网格 */}
            <View className="style-grid">
                {PRESET_STYLES.map((style) => (
                    <View
                        key={style.id}
                        className={`style-card ${value.curtainStyleId === style.id ? 'selected' : ''}`}
                        onClick={() => handleSelect(style)}
                    >
                        <Text className="style-icon">{style.icon}</Text>
                        <Text className="style-name">{style.name}</Text>
                        <Text className="style-category">{style.category}</Text>
                    </View>
                ))}
            </View>

            {/* 已选款式提示 */}
            {value.curtainStyleId && (
                <View className="selected-hint">
                    <Text>已选：{value.curtainStyleName}</Text>
                </View>
            )}

            {/* 底部操作按钮 */}
            <View className="step-actions">
                <View className="btn btn-secondary" onClick={onBack}>
                    上一步
                </View>
                <View
                    className={`btn btn-primary ${!canProceed ? 'disabled' : ''}`}
                    onClick={canProceed ? onNext : undefined}
                >
                    下一步：生成效果图
                </View>
            </View>
        </View>
    );
}
