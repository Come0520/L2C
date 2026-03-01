'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AnalyticsErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analytics chart caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="flex h-full min-h-[300px] items-center justify-center border-dashed">
          <CardContent className="text-muted-foreground flex h-full w-full flex-col items-center justify-center space-y-4 p-8 text-center">
            <div className="bg-destructive/10 rounded-full p-3">
              <AlertCircle className="text-destructive h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-foreground font-semibold">
                {this.props.fallbackTitle || '图表加载失败'}
              </h3>
              <p className="text-sm">
                {this.props.fallbackMessage ||
                  this.state.error?.message ||
                  '由于数据异常或网络波动，该图表暂时无法展示。'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false })}
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              尝试重试
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
