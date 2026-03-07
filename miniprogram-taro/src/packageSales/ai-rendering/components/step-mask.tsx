/**
 * Step 2 — 标注位置
 * 用户拍摄/上传现场室内照片，可输入文字备注
 * Canvas 涂鸦标注为 Phase 2 功能，当前 MVP 仅需上传原图 + 文字备注
 */
import { View, Text, Image, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCallback } from 'react';

interface StepMaskValue {
    originalImageBase64: string | null;
    userNotes: string;
}

interface StepMaskProps {
    value: StepMaskValue;
    onChange: (patch: Partial<StepMaskValue>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function StepMask({ value, onChange, onNext, onBack }: StepMaskProps) {
    /** 拍摄/选择现场室内照片 */
    const handleChooseRoom = useCallback(() => {
        Taro.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            camera: 'back',
            success: async (res) => {
                const tempFilePath = res.tempFiles[0]?.tempFilePath;
                if (!tempFilePath) return;

                // 压缩图片（Gemini 输入建议 < 4MB）
                const compressed = await Taro.compressImage({
                    src: tempFilePath,
                    quality: 85,
                });

                Taro.getFileSystemManager().readFile({
                    filePath: compressed.tempFilePath,
                    encoding: 'base64',
                    success: (fileRes) => {
                        onChange({ originalImageBase64: fileRes.data as string });
                        Taro.showToast({ title: '照片已上传', icon: 'success' });
                    },
                    fail: () => {
                        Taro.showToast({ title: '读取照片失败', icon: 'none' });
                    },
                });
            },
        });
    }, [onChange]);

    const canProceed = !!value.originalImageBase64;

    return (
        <View className="step-mask">
            <Text className="step-title">第 2 步：上传现场照片</Text>
            <Text className="step-desc">拍摄或上传安装窗帘的房间照片</Text>

            {/* 照片上传区 */}
            <View className="photo-upload-area" onClick={handleChooseRoom}>
                {value.originalImageBase64 ? (
                    <Image
                        src={`data:image/jpeg;base64,${value.originalImageBase64}`}
                        mode="aspectFit"
                        className="room-img"
                    />
                ) : (
                    <View className="upload-placeholder">
                        <Text className="upload-icon">📸</Text>
                        <Text className="upload-text">点击拍摄或从相册选择</Text>
                        <Text className="upload-hint">建议清晰拍摄窗户区域</Text>
                    </View>
                )}
            </View>

            {/* 已上传后显示重拍按钮 */}
            {value.originalImageBase64 && (
                <View className="retake-btn" onClick={handleChooseRoom}>
                    <Text>重新拍摄</Text>
                </View>
            )}

            {/* 文字备注（语音转文字 Phase 2） */}
            <View className="notes-section">
                <Text className="notes-label">补充说明（选填）</Text>
                <Textarea
                    className="notes-input"
                    placeholder="如：左侧窗户需要双层、落地窗、有飘窗台..."
                    value={value.userNotes}
                    onInput={(e) => onChange({ userNotes: e.detail.value })}
                    maxlength={200}
                />
            </View>

            {/* 底部操作按钮 */}
            <View className="step-actions">
                <View className="btn btn-secondary" onClick={onBack}>
                    上一步
                </View>
                <View
                    className={`btn btn-primary ${!canProceed ? 'disabled' : ''}`}
                    onClick={canProceed ? onNext : undefined}
                >
                    下一步：选款式
                </View>
            </View>
        </View>
    );
}
