'use client';

import { PaperCard, PaperCardHeader, PaperCardTitle, PaperCardContent } from '@/components/ui/paper-card';
import { Skeleton } from '@/components/ui/skeleton';

export function CustomerDetailSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-paper-400 border border-paper-600 rounded-xl shadow-paper-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-paper-600 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-800">客户详情</h2>
          <div className="w-10 h-10 rounded-full bg-paper-300 animate-pulse"></div>
        </div>
        
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>基本信息</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-paper-300 rounded-full animate-pulse">
                      <div className="w-6 h-6"></div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 pt-3 border-t border-paper-600">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>
            
            <div className="space-y-6">
              <PaperCard>
                <PaperCardHeader>
                  <PaperCardTitle>业务统计</PaperCardTitle>
                </PaperCardHeader>
                <PaperCardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-paper-300 rounded-lg space-y-2">
                      <Skeleton className="h-8 w-8 mx-auto" />
                      <Skeleton className="h-8 w-32 mx-auto" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                    <div className="text-center p-4 bg-paper-300 rounded-lg space-y-2">
                      <Skeleton className="h-8 w-8 mx-auto" />
                      <Skeleton className="h-8 w-32 mx-auto" />
                      <Skeleton className="h-4 w-24 mx-auto" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </PaperCardContent>
              </PaperCard>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-paper-600 flex items-center justify-end space-x-3">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>
    </div>
  );
}