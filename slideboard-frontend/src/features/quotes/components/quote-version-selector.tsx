'use client';

import React from 'react';

import { PaperButton } from '@/components/ui/paper-button';
import { QuoteVersion } from '@/shared/types/quote';

interface QuoteVersionSelectorProps {
  versions: QuoteVersion[];
  selectedVersionId: string | undefined;
  onSelect: (versionId: string) => void;
  onGenerateNew?: () => void;
}

export function QuoteVersionSelector({
  versions,
  selectedVersionId,
  onSelect,
  onGenerateNew
}: QuoteVersionSelectorProps) {
  // Sort versions descending
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-ink-700">报价版本</h3>
      <div className="flex flex-wrap gap-2">
        {sortedVersions.map(version => (
          <PaperButton
            key={version.id}
            variant={version.id === selectedVersionId ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onSelect(version.id)}
          >
            {version.versionSuffix || `V${version.versionNumber}`}
            <span className="ml-2 text-xs opacity-70">
              ({new Date(version.createdAt).toLocaleDateString()})
            </span>
          </PaperButton>
        ))}
        {onGenerateNew && (
          <PaperButton
            variant="outline"
            size="sm"
            onClick={onGenerateNew}
          >
            + 创建新版本
          </PaperButton>
        )}
      </div>
    </div>
  );
}
