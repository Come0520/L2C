/**
 * Step 2 — 标注位置（Phase 2 含 Canvas 涂鸦）
 *
 * 用户拍摄/上传现场室内照片后：
 * 1. 在照片上叠加 Canvas 2D 画板
 * 2. 手指触摸绘制红色高亮线条标注窗帘位置
 * 3. 支持「清空标注」重置
 * 4. 「下一步」时将标注合成为 base64 传给生成步骤
 */
import { View, Text, Image, Canvas, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useCallback, useRef, useState } from 'react';
import type { ITouchEvent } from '@tarojs/components';

interface StepMaskValue {
    originalImageBase64: string | null;
    userNotes: string;
    /** Phase 2: 合成了标注的图片 base64 */
    annotationDataUrl: string | null;
}

interface StepMaskProps {
    value: StepMaskValue;
    onChange: (patch: Partial<StepMaskValue>) => void;
    onNext: () => void;
    onBack: () => void;
}

/** Canvas 画布宽高（rpx 转 px 需在运行时计算） */
const CANVAS_ID = 'annotation-canvas';

export function StepMask({ value, onChange, onNext, onBack }: StepMaskProps) {
    // Canvas 上下文引用
    const ctxRef = useRef<any>(null);
    const canvasRef = useRef<any>(null);
    const [drawing, setDrawing] = useState(false);
    const [hasAnnotation, setHasAnnotation] = useState(false);

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
                        onChange({
                            originalImageBase64: fileRes.data as string,
                            annotationDataUrl: null,
                        });
                        setHasAnnotation(false);
                        Taro.showToast({ title: '照片已上传', icon: 'success' });
                        // 照片上传后初始化 Canvas
                        initCanvas();
                    },
                    fail: () => {
                        Taro.showToast({ title: '读取照片失败', icon: 'none' });
                    },
                });
            },
        });
    }, [onChange]);

    /** 初始化 Canvas 2D 上下文 */
    const initCanvas = useCallback(() => {
        setTimeout(() => {
            const query = Taro.createSelectorQuery();
            query.select(`#${CANVAS_ID}`)
                .fields({ node: true, size: true })
                .exec((res) => {
                    if (!res?.[0]) return;
                    const canvas = res[0].node;
                    const ctx = canvas.getContext('2d');
                    // 设置 Canvas 物理像素匹配
                    const dpr = Taro.getSystemInfoSync().pixelRatio;
                    canvas.width = res[0].width * dpr;
                    canvas.height = res[0].height * dpr;
                    ctx.scale(dpr, dpr);
                    // 画笔样式：红色高亮
                    ctx.strokeStyle = 'rgba(255, 50, 50, 0.7)';
                    ctx.lineWidth = 4;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctxRef.current = ctx;
                    canvasRef.current = canvas;
                });
        }, 300);
    }, []);

    /** 触摸开始：定位起点 */
    const onTouchStart = useCallback((e: ITouchEvent) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        const touch = e.touches[0];
        ctx.beginPath();
        ctx.moveTo(touch.x, touch.y);
        setDrawing(true);
    }, []);

    /** 触摸移动：绘制线条 */
    const onTouchMove = useCallback((e: ITouchEvent) => {
        if (!drawing) return;
        const ctx = ctxRef.current;
        if (!ctx) return;
        const touch = e.touches[0];
        ctx.lineTo(touch.x, touch.y);
        ctx.stroke();
        setHasAnnotation(true);
    }, [drawing]);

    /** 触摸结束 */
    const onTouchEnd = useCallback(() => {
        setDrawing(false);
    }, []);

    /** 清空所有标注 */
    const handleClear = useCallback(() => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasAnnotation(false);
        onChange({ annotationDataUrl: null });
    }, [onChange]);

    /** 导出标注，将 Canvas 内容合成为图片 */
    const handleExportAndNext = useCallback(async () => {
        if (!hasAnnotation) {
            // 没有标注，直接用原图
            onNext();
            return;
        }
        try {
            const canvas = canvasRef.current;
            if (!canvas) {
                onNext();
                return;
            }
            // Taro Canvas toDataURL 导出
            const res = await Taro.canvasToTempFilePath({
                canvas,
                fileType: 'jpg',
                quality: 0.9,
            });
            // 将临时文件转 base64
            Taro.getFileSystemManager().readFile({
                filePath: res.tempFilePath,
                encoding: 'base64',
                success: (fileRes) => {
                    onChange({ annotationDataUrl: fileRes.data as string });
                    onNext();
                },
                fail: () => {
                    // 导出失败也继续，使用原图
                    onNext();
                },
            });
        } catch {
            onNext();
        }
    }, [hasAnnotation, onChange, onNext]);

    const canProceed = !!value.originalImageBase64;

    return (
        <View className="step-mask">
            <Text className="step-title">第 2 步：上传现场照片</Text>
            <Text className="step-desc">拍摄窗户区域，可在照片上标注窗帘位置</Text>

            {/* 照片上传区 / Canvas 画板 */}
            {value.originalImageBase64 ? (
                <View className="canvas-container">
                    {/* 底图 */}
                    <Image
                        src={`data:image/jpeg;base64,${value.originalImageBase64}`}
                        mode="widthFix"
                        className="room-img-canvas-bg"
                    />
                    {/* 叠加 Canvas 画板 */}
                    <Canvas
                        type="2d"
                        id={CANVAS_ID}
                        className="annotation-canvas"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    />
                    {/* 工具栏 */}
                    <View className="canvas-toolbar">
                        <View className="toolbar-btn" onClick={handleChooseRoom}>
                            <Text>📷 重新拍摄</Text>
                        </View>
                        {hasAnnotation && (
                            <View className="toolbar-btn toolbar-btn--danger" onClick={handleClear}>
                                <Text>🗑️ 清空标注</Text>
                            </View>
                        )}
                    </View>
                    <Text className="canvas-hint">
                        {hasAnnotation ? '✅ 已标注，可继续绘制或点「下一步」' : '👆 用手指在照片上画出窗帘位置'}
                    </Text>
                </View>
            ) : (
                <View className="photo-upload-area" onClick={handleChooseRoom}>
                    <View className="upload-placeholder">
                        <Text className="upload-icon">📸</Text>
                        <Text className="upload-text">点击拍摄或从相册选择</Text>
                        <Text className="upload-hint">建议清晰拍摄窗户区域</Text>
                    </View>
                </View>
            )}

            {/* 文字备注 */}
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
                    onClick={canProceed ? handleExportAndNext : undefined}
                >
                    下一步：选款式
                </View>
            </View>
        </View>
    );
}
