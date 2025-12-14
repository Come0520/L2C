import { Download, ChevronDown } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';

export type ExportFormat = 'csv' | 'excel' | 'pdf';

interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  className?: string;
}

export function ExportMenu({ onExport, className }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-theme-border rounded-md text-sm font-medium text-theme-text-primary bg-theme-bg-secondary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        <Download className="h-4 w-4 mr-2" />
        导出当前页
        <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform duration-200", isOpen && "transform rotate-180")} />
      </button>

      {isOpen && (
        <div ref={menuRef} className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-theme-bg-secondary border border-theme-border z-10 animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleExport('csv')}
              className="block w-full text-left px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
              role="menuitem"
            >
              CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="block w-full text-left px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
              role="menuitem"
            >
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="block w-full text-left px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-tertiary transition-colors"
              role="menuitem"
            >
              PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

