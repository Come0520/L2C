'use client';

import React from 'react';

import { cn } from '@/utils/lib-utils';

interface PaperTableProps {
  children: React.ReactNode;
  className?: string;
  striped?: boolean;
  hover?: boolean;
}

export const PaperTable: React.FC<PaperTableProps> = ({ children, className, striped = false, hover = true }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-paper-600 bg-paper-100 shadow-paper dark:bg-neutral-900 dark:border-neutral-800">
      <table className={cn('paper-table w-full', className)}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            type WithStripedHover = { striped?: boolean; hover?: boolean };
            return React.cloneElement(child as React.ReactElement<WithStripedHover>, {
              striped,
              hover,
            });
          }
          return child;
        })}
      </table>
    </div>
  );
};

interface PaperTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperTableHeader: React.FC<PaperTableHeaderProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-paper-300 dark:bg-neutral-900', className)}>
      <tr>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            type WithIsHeader = { isHeader?: boolean };
            return React.cloneElement(child as React.ReactElement<WithIsHeader>, { isHeader: true });
          }
          return child;
        })}
      </tr>
    </thead>
  );
};

interface PaperTableBodyProps {
  children: React.ReactNode;
  className?: string;
  striped?: boolean;
  hover?: boolean;
}

export const PaperTableBody: React.FC<PaperTableBodyProps> = ({ children, className, striped, hover }) => {
  return (
    <tbody className={cn('dark:divide-y dark:divide-neutral-800', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          type RowAugment = { index?: number; striped?: boolean; hover?: boolean };
          return React.cloneElement(child as React.ReactElement<RowAugment>, {
            index,
            striped,
            hover,
          });
        }
        return child;
      })}
    </tbody>
  );
};

interface PaperTableRowProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  striped?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export const PaperTableRow: React.FC<PaperTableRowProps> = ({ 
  children, 
  className, 
  index = 0, 
  striped = false, 
  hover = true,
  onClick 
}) => {
  const classes = cn(
    striped && index % 2 === 0 ? 'bg-paper-200 dark:bg-neutral-800/50' : 'bg-paper-100 dark:bg-neutral-900',
    hover && 'hover:bg-paper-300 dark:hover:bg-neutral-800/80 transition-colors duration-150',
    'content-visibility auto border-b border-paper-500 dark:border-neutral-800 last:border-0',
    onClick && 'cursor-pointer',
    className
  );
  
  return (
    <tr className={classes} onClick={onClick}>
      {children}
    </tr>
  );
};

interface PaperTableCellProps {
  children: React.ReactNode;
  className?: string;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
}

export const PaperTableCell: React.FC<PaperTableCellProps> = ({ 
  children, 
  className, 
  isHeader = false, 
  align = 'left',
  colSpan
}) => {
  const classes = cn(
    'px-4 py-3',
    align === 'center' && 'text-center',
    align === 'right' && 'text-right',
    isHeader 
      ? 'text-ink-700 font-medium border-b border-paper-600 bg-paper-300 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 uppercase text-xs tracking-wider'
      : 'text-ink-600 dark:text-neutral-300',
    className
  );
  
  const Tag = isHeader ? 'th' : 'td';
  
  return (
    <Tag className={classes} {...(typeof colSpan === 'number' ? { colSpan } : {})}>
      {children}
    </Tag>
  );
};

const PaperTableHeaderCell: React.FC<PaperTableCellProps> = (props) => {
  return <PaperTableCell {...props} isHeader={true} />;
};

interface PaperTableFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperTableFooter: React.FC<PaperTableFooterProps> = ({ children, className }) => {
  return (
    <tfoot className={cn('bg-paper-300 border-t border-paper-600', className)}>
      {children}
    </tfoot>
  );
};

// 表格工具栏组件
interface PaperTableToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperTableToolbar: React.FC<PaperTableToolbarProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center justify-between p-4 border-b border-paper-600 bg-paper-200', className)}>
      {children}
    </div>
  );
};

// 表格分页组件
interface PaperTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const PaperTablePagination: React.FC<PaperTablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  
  return (
    <div className={cn('flex items-center justify-between p-4 border-t border-paper-600 bg-paper-200', className)}>
      <div className="text-sm text-ink-500">
        显示 {startItem} 到 {endItem} 条，共 {totalItems} 条记录
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="paper-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          上一页
        </button>
        
        <span className="text-sm text-ink-600">
          第 {currentPage} 页，共 {totalPages} 页
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="paper-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下一页
        </button>
      </div>
    </div>
  );
};

const PaperTableWithStatics = Object.assign(PaperTable, {
  Header: PaperTableHeader,
  HeaderCell: PaperTableHeaderCell,
  Body: PaperTableBody,
  Row: PaperTableRow,
  Cell: PaperTableCell,
  Footer: PaperTableFooter,
  Toolbar: PaperTableToolbar,
  Pagination: PaperTablePagination,
});

export default PaperTableWithStatics;
