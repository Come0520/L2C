"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
import { Button } from "@/shared/ui/button";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger('WidgetErrorBoundary');

interface Props {
    children: ReactNode;
    title?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Widget 级错误边界
 * 用于包裹单个 Widget，确保局部崩溃不影响整个仪表盘
 */
export class WidgetErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
        logger.error("Widget rendered failed", { error: error.message }, error);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Card className="h-full border-destructive/20 bg-destructive/5">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            {this.props.title || "组件加载失败"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                        <p className="text-xs text-muted-foreground mb-4 max-w-[200px] truncate">
                            {this.state.error?.message || "发生未知错误"}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={this.handleReset}
                            className="h-8 gap-2"
                        >
                            <RefreshCcw className="h-3 w-3" />
                            重试
                        </Button>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}
