/**
 * Step 1 — 选面料
 * 支持两个入口：从云展厅选择（复用展厅选品流程）或上传自有面料图片
 */
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCallback } from 'react';

interface StepFabricValue {
    fabricSource: 'showroom' | 'upload';
    fabricImageBase64: string | null;
    fabricDescription: string;
}

interface StepFabricProps {
    value: StepFabricValue;
    onChange: (patch: Partial<StepFabricValue>) => void;
    onNext: () => void;
    onBack: () => void;
}

export function StepFabric({ value, onChange, onNext, onBack }: StepFabricProps) {
    /** 从云展厅选择面料（跳转展厅选品页并接收回调） */
    const handleChooseFromShowroom = useCallback(() => {
        const eventName = `ON_FABRIC_SELECT_${Date.now()}`;

        // 监听云展厅的选择回调
        Taro.eventCenter.once(eventName, (item) => {
            if (!item) return;

            Taro.showLoading({ title: '正在提取面料...', mask: true });

            // 选中的是云展厅里的网络图片，需要下载并转 Base64 传递给 AI
            Taro.downloadFile({
                url: item.coverUrl,
                success: (res) => {
                    const tempFilePath = res.tempFilePath;
                    Taro.getFileSystemManager().readFile({
                        filePath: tempFilePath,
                        encoding: 'base64',
                        success: (fileRes) => {
                            onChange({
                                fabricSource: 'showroom',
                                fabricImageBase64: fileRes.data as string,
                                fabricDescription: item.title || '云展厅面料',
                            });
                            Taro.hideLoading();
                            Taro.showToast({ title: '已选定面料', icon: 'success' });
                        },
                        fail: () => {
                            Taro.hideLoading();
                            Taro.showToast({ title: '读取网图失败', icon: 'none' });
                        }
                    });
                },
                fail: () => {
                    Taro.hideLoading();
                    Taro.showToast({ title: '下载面料图失败', icon: 'none' });
                }
            });
        });

        // 跳转到云展厅的特定模式
        Taro.navigateTo({
            url: `/pages/showroom/index?mode=select&eventName=${eventName}`
        });
    }, [onChange]);

    /** 上传自有面料图片 */
    const handleUploadFabric = useCallback(() => {
        Taro.chooseMedia({
            count: 1,
            mediaType: ['image'],
            sourceType: ['album', 'camera'],
            success: async (res) => {
                const tempFilePath = res.tempFiles[0]?.tempFilePath;
                if (!tempFilePath) return;

                // 压缩后转 Base64
                const compressed = await Taro.compressImage({
                    src: tempFilePath,
                    quality: 80,
                });

                Taro.getFileSystemManager().readFile({
                    filePath: compressed.tempFilePath,
                    encoding: 'base64',
                    success: (fileRes) => {
                        onChange({
                            fabricSource: 'upload',
                            fabricImageBase64: fileRes.data as string,
                            fabricDescription: '用户上传自有面料',
                        });
                        Taro.showToast({ title: '面料图片已上传', icon: 'success' });
                    },
                    fail: () => {
                        Taro.showToast({ title: '读取图片失败', icon: 'none' });
                    },
                });
            },
        });
    }, [onChange]);

    /** 是否允许进入下一步 */
    const canProceed =
        value.fabricSource === 'showroom' || (value.fabricSource === 'upload' && !!value.fabricImageBase64);

    return (
        <View className="step-fabric">
            <Text className="step-title">第 1 步：选择面料</Text>
            <Text className="step-desc">请选择用于生成效果图的窗帘面料</Text>

            {/* 两个入口卡片 */}
            <View className="choice-cards">
                <View
                    className={`choice-card ${value.fabricSource === 'showroom' ? 'selected' : ''}`}
                    onClick={handleChooseFromShowroom}
                >
                    <Text className="card-icon">🏪</Text>
                    <Text className="card-title">从云展厅选择</Text>
                    <Text className="card-desc">从已上架产品中选择面料（免费）</Text>
                </View>

                <View
                    className={`choice-card ${value.fabricSource === 'upload' ? 'selected' : ''}`}
                    onClick={handleUploadFabric}
                >
                    <Text className="card-icon">📷</Text>
                    <Text className="card-title">上传自有面料</Text>
                    <Text className="card-desc">上传面料图片（额外消耗 1 积分）</Text>
                </View>
            </View>

            {/* 已上传面料预览 */}
            {value.fabricImageBase64 && (
                <View className="preview-area">
                    <Text className="preview-label">
                        已选面料：{value.fabricSource === 'showroom' ? value.fabricDescription : '自有图片'}
                    </Text>
                    <Image
                        src={`data:image/jpeg;base64,${value.fabricImageBase64}`}
                        mode="aspectFit"
                        className="preview-img"
                    />
                </View>
            )}

            {/* 底部操作按钮 */}
            <View className="step-actions">
                <View className="btn btn-secondary" onClick={onBack}>
                    返回
                </View>
                <View
                    className={`btn btn-primary ${!canProceed ? 'disabled' : ''}`}
                    onClick={canProceed ? onNext : undefined}
                >
                    下一步：标注位置
                </View>
            </View>
        </View>
    );
}
