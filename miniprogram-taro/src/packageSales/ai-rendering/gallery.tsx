/**
 * AI 效果图库页面
 * 展示租户历史渲染记录，瀑布流布局，支持查看大图、重新生成
 */

import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { useState } from 'react';
import { getRenderingHistory, type RenderingHistoryItem, type CreditBalance } from '@/services/ai-rendering';
import './gallery.scss';

export default function AiGalleryPage() {
    const [history, setHistory] = useState<RenderingHistoryItem[]>([]);
    const [credits, setCredits] = useState<CreditBalance | null>(null);
    const [loading, setLoading] = useState(true);

    useLoad(async () => {
        try {
            const data = await getRenderingHistory();
            setHistory(data.history);
            setCredits(data.credits);
        } catch {
            Taro.showToast({ title: '加载失败', icon: 'none' });
        } finally {
            setLoading(false);
        }
    });

    /** 查看大图 */
    const handlePreview = (item: RenderingHistoryItem) => {
        if (!item.resultImageUrl) return;
        Taro.previewImage({ urls: [item.resultImageUrl], current: item.resultImageUrl });
    };

    /** 跳转到向导重新生成 */
    const handleRegenerate = () => {
        Taro.navigateTo({ url: '/packageSales/ai-rendering/index' });
    };

    const completedList = history.filter((h) => h.status === 'completed');

    return (
        <View className="gallery-page">
            {/* 积分余额卡片 */}
            {credits && (
                <View className="credits-card">
                    <View className="credits-info">
                        <Text className="credits-label">本月积分余额</Text>
                        <Text className="credits-value">{credits.remaining}</Text>
                        <Text className="credits-total">/ {credits.total === 9999 ? '∞' : credits.total} 点</Text>
                    </View>
                    <View className="credits-bar">
                        <View
                            className="credits-bar-used"
                            style={{
                                width: credits.total === 9999 ? '0%' : `${Math.min(100, (credits.used / credits.total) * 100)}%`,
                            }}
                        />
                    </View>
                    <Text className="credits-desc">已使用 {credits.used} 点</Text>
                </View>
            )}

            {/* 生成按钮 */}
            <View className="generate-entry" onClick={handleRegenerate}>
                <Text className="generate-btn-text">✨ 生成新效果图</Text>
            </View>

            {/* 历史列表 */}
            {loading ? (
                <View className="loading-state">
                    <Text>加载中...</Text>
                </View>
            ) : completedList.length === 0 ? (
                <View className="empty-state">
                    <Text className="empty-icon">🖼️</Text>
                    <Text className="empty-text">暂无效果图</Text>
                    <Text className="empty-desc">点击上方按钮生成第一张效果图</Text>
                </View>
            ) : (
                <ScrollView scrollY className="gallery-scroll">
                    <View className="gallery-grid">
                        {completedList.map((item) => (
                            <View
                                key={item.id}
                                className="gallery-item"
                                onClick={() => handlePreview(item)}
                            >
                                {item.resultImageUrl ? (
                                    <Image
                                        src={item.resultImageUrl}
                                        mode="aspectFill"
                                        className="gallery-img"
                                        lazyLoad
                                    />
                                ) : (
                                    <View className="gallery-placeholder">
                                        <Text>无图</Text>
                                    </View>
                                )}
                                <View className="gallery-meta">
                                    <Text className="meta-style">{item.curtainStyleId ?? '未知款式'}</Text>
                                    <Text className="meta-credits">消耗 {item.creditsUsed} 分</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}
