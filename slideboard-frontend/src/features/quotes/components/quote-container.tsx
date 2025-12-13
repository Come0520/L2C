'use client';

import React, { useState, useEffect, useCallback } from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { PaperCard, PaperCardContent, PaperCardHeader, PaperCardTitle } from '@/components/ui/paper-card';
import { quoteService } from '@/services/quotes.client';
import { Quote } from '@/shared/types/quote';

import { QuoteDetail } from './quote-detail';
import { QuoteVersionSelector } from './quote-version-selector';

interface QuoteContainerProps {
  leadId: string;
  onGenerateNewQuote: (fromVersion?: number) => void;
  onSetCurrentVersion: (version: number) => void;
  onDraftSign: () => void;
  onEditQuote: (quoteId: string) => void;
}

export function QuoteContainer({ 
  leadId, 
  onGenerateNewQuote, 
  onSetCurrentVersion, 
  onDraftSign, 
  onEditQuote 
}: QuoteContainerProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(undefined);

  const loadQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quoteService.getQuotesByLead(leadId);
      setQuotes(data);
      
      if (data.length > 0 && data[0]) {
        // Default to first quote if none selected or not found
        if (!selectedQuoteId || !data.find(q => q.id === selectedQuoteId)) {
          setSelectedQuoteId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [leadId, selectedQuoteId]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // When selectedQuoteId changes, update selectedVersionId to latest
  useEffect(() => {
    if (selectedQuoteId) {
      const quote = quotes.find(q => q.id === selectedQuoteId);
      if (quote && quote.versions && quote.versions.length > 0) {
        const latest = [...quote.versions].sort((a, b) => b.versionNumber - a.versionNumber)[0];
        setSelectedVersionId(latest.id);
      }
    }
  }, [selectedQuoteId, quotes]);

  const activeQuote = quotes.find(q => q.id === selectedQuoteId);
  const selectedVersionData = activeQuote?.versions?.find(v => v.id === selectedVersionId);
  const isCurrentVersion = activeQuote?.currentVersionId === selectedVersionId;

  if (loading) {
    return (
      <PaperCard>
        <PaperCardContent className="p-8 text-center text-ink-500">
          加载报价信息中...
        </PaperCardContent>
      </PaperCard>
    );
  }

  if (quotes.length === 0) {
    return (
      <PaperCard>
        <PaperCardHeader>
          <PaperCardTitle>报价详情</PaperCardTitle>
        </PaperCardHeader>
        <PaperCardContent>
          <div className="text-center py-8 text-ink-500 bg-paper-50 rounded-lg border border-dashed border-paper-200">
            <p className="mb-4">暂无报价记录</p>
            <PaperButton variant="primary" onClick={() => onGenerateNewQuote()}>
              生成首份报价
            </PaperButton>
          </div>
        </PaperCardContent>
      </PaperCard>
    );
  }

  return (
    <PaperCard>
      <PaperCardHeader>
        <PaperCardTitle>报价详情</PaperCardTitle>
      </PaperCardHeader>
      <PaperCardContent>
        <div className="space-y-6">
          {/* Quote Selection (if multiple) */}
          {quotes.length > 1 && (
            <div className="mb-4 p-4 bg-paper-50 rounded-md">
              <h3 className="text-sm font-medium text-ink-700 mb-2">选择报价项目</h3>
              <div className="flex flex-wrap gap-2">
                {quotes.map(q => (
                  <PaperButton
                    key={q.id}
                    variant={q.id === selectedQuoteId ? 'primary' : 'outline'}
                    onClick={() => setSelectedQuoteId(q.id)}
                    size="sm"
                  >
                    {q.projectName}
                  </PaperButton>
                ))}
              </div>
            </div>
          )}

          {/* Version Selection */}
          {activeQuote && activeQuote.versions && (
            <QuoteVersionSelector 
              versions={activeQuote.versions}
              selectedVersionId={selectedVersionId}
              onSelect={setSelectedVersionId}
              onGenerateNew={() => onGenerateNewQuote(selectedVersionData?.versionNumber)}
            />
          )}

          {/* Version Detail */}
          {selectedVersionData ? (
            <QuoteDetail 
              version={selectedVersionData}
              onEdit={selectedQuoteId ? () => onEditQuote(selectedQuoteId) : undefined}
              onConfirm={onDraftSign}
              onSetCurrent={isCurrentVersion ? undefined : () => onSetCurrentVersion(selectedVersionData.versionNumber)}
              isCurrentVersion={isCurrentVersion}
              // onPublish implementation pending
            />
          ) : (
            <div className="text-center py-8 text-ink-400">
              请选择一个报价版本查看详情
            </div>
          )}
        </div>
      </PaperCardContent>
    </PaperCard>
  );
}
