/**
 * Step 4 — 生成效果图
 * 用户点击「生成效果图」→ 显示加载动画 → 展示结果
 * 结果页支持：保存到图库 / 分享到微信 / 重新生成
 */
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useState, useCallback } from 'react';
import { generateRendering } from '@/services/ai-rendering';

/** 主页面向导状态（由主容器传入） */
interface WizardState {
    fabricSource: 'showroom' | 'upload';
    fabricImageBase64: string | null;
    fabricDescription: string;
    originalImageBase64: string | null;
    userNotes: string;
    curtainStyleId: string;
    curtainStyleName: string;
}

interface StepGenerateProps {
    wizardState: WizardState;
    onBack: () => void;
    onRestart: () => void;
}

type GenerateStatus = 'idle' | 'loading' | 'success' | 'error';

export function StepGenerate({ wizardState, onBack, onRestart }: StepGenerateProps) {
    const [status, setStatus] = useState<GenerateStatus>('idle');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [creditsUsed, setCreditsUsed] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [retryCount, setRetryCount] = useState<number>(0);

    /** 发起生成请求 */
    const handleGenerate = useCallback(async () => {
        if (!wizardState.originalImageBase64) {
            Taro.showToast({ title: '请先上传现场照片', icon: 'none' });
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        Taro.showLoading({ title: 'AI 正在思考中...', mask: true });

        try {
            const result = await generateRendering({
                originalImageBase64: wizardState.originalImageBase64,
                curtainStyleId: wizardState.curtainStyleId,
                fabricDescription: wizardState.fabricDescription,
                fabricSource: wizardState.fabricSource,
                fabricImageBase64: wizardState.fabricImageBase64,
                userNotes: wizardState.userNotes || null,
                retryCount,
            });

            Taro.hideLoading();
            setResultImage(result.resultImageBase64);
            setCreditsUsed(result.creditsUsed);
            setStatus('success');
        } catch (err) {
            Taro.hideLoading();
            const msg = err instanceof Error ? err.message : '生成失败，请重试';
            setErrorMsg(msg);
            setStatus('error');
        }
    }, [wizardState, retryCount]);

    /** 保存效果图到相册 */
    const handleSave = useCallback(async () => {
        if (!resultImage) return;

        try {
            // 将 Base64 写入临时文件再保存
            const base64Data = resultImage.replace(/^data:image\/\w+;base64,/, '');
            const tempFilePath = `${Taro.env.USER_DATA_PATH}/ai_rendering_${Date.now()}.jpg`;

            Taro.getFileSystemManager().writeFile({
                filePath: tempFilePath,
                data: base64Data,
                encoding: 'base64',
                success: () => {
                    Taro.saveImageToPhotosAlbum({
                        filePath: tempFilePath,
                        success: () => Taro.showToast({ title: '已保存到相册', icon: 'success' }),
                        fail: () => Taro.showToast({ title: '保存失败，请检查相册权限', icon: 'none' }),
                    });
                },
            });
        } catch {
            Taro.showToast({ title: '保存失败', icon: 'none' });
        }
    }, [resultImage]);

    /** 重新生成（免费首次重试） */
    const handleRetry = useCallback(() => {
        setRetryCount((prev) => prev + 1);
        setStatus('idle');
        setResultImage(null);
    }, []);

    return (
        <View className="step-generate">
            <Text className="step-title">第 4 步：生成效果图</Text>

            {/* 选择信息摘要 */}
            <View className="summary-card">
                <View className="summary-row">
                    <Text className="summary-label">款式：</Text>
                    <Text className="summary-value">{wizardState.curtainStyleName}</Text>
                </View>
                <View className="summary-row">
                    <Text className="summary-label">面料：</Text>
                    <Text className="summary-value">
                        {wizardState.fabricSource === 'upload' ? '自有面料（+1 积分）' : '云展厅面料'}
                    </Text>
                </View>
            </View>

            {/* 生成按钮（idle/error 状态显示） */}
            {(status === 'idle' || status === 'error') && (
                <View className="generate-area">
                    {status === 'error' && (
                        <View className="error-msg">
                            <Text className="error-text">❌ {errorMsg}</Text>
                        </View>
                    )}
                    <View className="btn btn-primary generate-btn" onClick={handleGenerate}>
                        <Text>✨ 生成效果图（消耗 {wizardState.fabricSource === 'upload' ? 3 : 2} 积分）</Text>
                    </View>
                </View>
            )}

            {/* 加载中 */}
            {status === 'loading' && (
                <View className="loading-area">
                    <View className="loading-spinner" />
                    <Text className="loading-text">AI 正在绘制效果图，约需 10-30 秒...</Text>
                </View>
            )}

            {/* 成功：展示结果 */}
            {status === 'success' && resultImage && (
                <View className="result-area">
                    <Text className="result-credits">本次消耗 {creditsUsed} 积分</Text>
                    <Image src={resultImage} mode="widthFix" className="result-img" showMenuByLongpress />

                    <View className="result-actions">
                        <View className="btn btn-outline" onClick={handleSave}>
                            💾 保存图片
                        </View>
                        <View className="btn btn-outline" onClick={handleRetry}>
                            🔄 重新生成{retryCount === 0 ? '（首次免费）' : ''}
                        </View>
                    </View>
                </View>
            )}

            {/* 底部操作 */}
            <View className="step-actions">
                {status !== 'loading' && (
                    <>
                        {status !== 'success' && (
                            <View className="btn btn-secondary" onClick={onBack}>
                                上一步
                            </View>
                        )}
                        {status === 'success' && (
                            <View className="btn btn-secondary" onClick={onRestart}>
                                再来一张
                            </View>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}
