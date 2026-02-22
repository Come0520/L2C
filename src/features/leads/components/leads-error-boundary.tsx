'use client';

import { logger } from "@/shared/lib/logger";
import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * 线索模块专用错误边界组件
 * 提供对 UI 崩溃的捕获及一键重试/刷新功能
 */
export class LeadsErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // 在生产环境中可以上报到 Sentry 等监控系统
        logger.error('Leads Error Boundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        // 简单暴力但有效的方案：强制刷新页面
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 min-h-[400px] flex items-center justify-center">
                    <Alert variant="destructive" className="max-w-xl shadow-lg border-2">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle className="text-lg font-bold">线索模块加载异常</AlertTitle>
                        <AlertDescription className="mt-3">
                            <p className="text-sm">系统在处理线索列表或详细信息时遇到了未知冲突，这可能是由于网络波动或数据渲染异常引起的。</p>

                            {this.state.error && (
                                <div className="mt-4 p-3 bg-red-950/20 rounded border border-red-500/20 overflow-hidden">
                                    <p className="text-xs font-mono break-all opacity-80">
                                        Error: {this.state.error.message}
                                    </p>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={this.handleReset}
                                    className="bg-background hover:bg-muted"
                                >
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    强制刷新并重试
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        return this.props.children;
    }
}
