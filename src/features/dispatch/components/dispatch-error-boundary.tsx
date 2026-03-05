'use client';

import { logger } from '@/shared/lib/logger';
import React from 'react';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import RefreshCcw from 'lucide-react/dist/esm/icons/refresh-ccw';
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
 * 调度模块专用错误边界组件
 * 提供对 UI 崩溃的捕获及一键重试/刷新功能
 */
export class DispatchErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Dispatch Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-xl border-2 shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-bold">调度模块加载异常</AlertTitle>
            <AlertDescription className="mt-3">
              <p className="text-sm">系统在处理调度规则或任务列表时遇到了未知错误。</p>

              {this.state.error && (
                <div className="mt-4 overflow-hidden rounded border border-red-500/20 bg-red-950/20 p-3">
                  <p className="font-mono text-xs break-all opacity-80">
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
                  强制刷新重试
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
