'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { Star, ThumbsUp, MessageCircle, CheckCircle, Send } from 'lucide-react';

/**
 * H5 客户评价页面
 * 
 * 功能：
 * 1. 满意度评分（1-5星）
 * 2. 服务评价标签
 * 3. 文字反馈
 * 4. 完成感谢页
 */

interface CustomerFeedbackPageProps {
    ticketNo: string;
    customerName: string;
    serviceSummary: string;
    onSubmit?: (feedback: CustomerFeedback) => Promise<void>;
}

interface CustomerFeedback {
    satisfaction: number;
    channelSatisfaction: number;
    tags: string[];
    comment: string;
}

const FEEDBACK_TAGS = [
    { id: 'fast', label: '响应迅速', icon: '⚡' },
    { id: 'professional', label: '专业负责', icon: '👨‍🔧' },
    { id: 'polite', label: '态度友好', icon: '😊' },
    { id: 'quality', label: '质量满意', icon: '✅' },
    { id: 'clean', label: '现场整洁', icon: '🧹' },
    { id: 'recommend', label: '推荐给朋友', icon: '👍' },
];

export function CustomerFeedbackPage({
    ticketNo,
    customerName,
    serviceSummary,
    onSubmit,
}: CustomerFeedbackPageProps) {
    const [satisfaction, setSatisfaction] = useState(0);
    const [channelSatisfaction, setChannelSatisfaction] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const toggleTag = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const handleSubmit = async () => {
        if (satisfaction === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit?.({
                satisfaction,
                channelSatisfaction,
                tags: selectedTags,
                comment,
            });
            setIsSubmitted(true);
        } catch (error) {
            console.error('提交评价失败:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 星级评分组件
    const StarRating = ({
        value,
        onChange,
        label
    }: {
        value: number;
        onChange: (v: number) => void;
        label: string;
    }) => (
        <div className="space-y-2">
            <div className="text-sm font-medium text-center">{label}</div>
            <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange(star)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                    >
                        <Star
                            className={`h-10 w-10 ${star <= value
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                        />
                    </button>
                ))}
            </div>
            <div className="text-xs text-center text-muted-foreground">
                {value === 0 && '点击选择评分'}
                {value === 1 && '非常不满意'}
                {value === 2 && '不满意'}
                {value === 3 && '一般'}
                {value === 4 && '满意'}
                {value === 5 && '非常满意'}
            </div>
        </div>
    );

    // 提交成功页
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardContent className="pt-10 pb-8">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">感谢您的评价！</h2>
                        <p className="text-muted-foreground mb-6">
                            您的反馈对我们非常重要，我们将持续改进服务质量。
                        </p>
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`h-8 w-8 ${star <= satisfaction
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
            <div className="max-w-md mx-auto space-y-4">
                {/* 头部 */}
                <div className="text-center pt-4 pb-2">
                    <h1 className="text-xl font-bold">服务评价</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        工单号: {ticketNo}
                    </p>
                </div>

                {/* 服务摘要 */}
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm">
                            <p className="font-medium">{customerName}，您好！</p>
                            <p className="text-muted-foreground mt-1">{serviceSummary}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* 整体满意度 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-center">整体满意度</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StarRating
                            value={satisfaction}
                            onChange={setSatisfaction}
                            label="请为本次服务打分"
                        />
                    </CardContent>
                </Card>

                {/* 渠道评价 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base text-center">处理效率</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <StarRating
                            value={channelSatisfaction}
                            onChange={setChannelSatisfaction}
                            label="问题处理的及时性"
                        />
                    </CardContent>
                </Card>

                {/* 评价标签 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 justify-center">
                            <ThumbsUp className="h-4 w-4" />
                            服务亮点
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {FEEDBACK_TAGS.map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => toggleTag(tag.id)}
                                    className={`px-3 py-2 rounded-full text-sm transition-all ${selectedTags.includes(tag.id)
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted hover:bg-muted/80'
                                        }`}
                                >
                                    {tag.icon} {tag.label}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 文字反馈 */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 justify-center">
                            <MessageCircle className="h-4 w-4" />
                            其他建议
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="您还有什么想对我们说的...（选填）"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="min-h-[100px]"
                            maxLength={500}
                        />
                        <div className="text-xs text-right text-muted-foreground mt-1">
                            {comment.length}/500
                        </div>
                    </CardContent>
                </Card>

                {/* 提交按钮 */}
                <Button
                    className="w-full h-12 text-lg"
                    disabled={satisfaction === 0 || isSubmitting}
                    onClick={handleSubmit}
                >
                    {isSubmitting ? '提交中...' : '提交评价'}
                    <Send className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-xs text-center text-muted-foreground pb-4">
                    您的评价将帮助我们改进服务
                </p>
            </div>
        </div>
    );
}
