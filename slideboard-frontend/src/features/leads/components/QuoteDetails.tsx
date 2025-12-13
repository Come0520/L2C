'use client'

import React from 'react'

import { QuoteContainer } from '@/features/quotes/components/quote-container'
import { Lead } from '@/shared/types/lead'

interface QuoteDetailsProps {
  lead: Lead
  onGenerateNewQuote: (fromVersion?: number) => void
  onSetCurrentVersion: (version: number) => void
  onDraftSign: () => void
  onEditQuote: (quoteId: string) => void
}

export default function QuoteDetails({ 
  lead, 
  onGenerateNewQuote, 
  onSetCurrentVersion, 
  onDraftSign, 
  onEditQuote 
}: QuoteDetailsProps) {
  return (
    <QuoteContainer 
      leadId={lead.id}
      onGenerateNewQuote={onGenerateNewQuote}
      onSetCurrentVersion={onSetCurrentVersion}
      onDraftSign={onDraftSign}
      onEditQuote={onEditQuote}
    />
  )
}
