'use client';

import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import React from 'react';

import { cn } from '@/utils/lib-utils';

// -------------------- 动画配置 (保持轻量) -------------------- 

// 容器动画：控制子元素的交错显示 
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

// 行动画：控制单行的进入和退出 
const rowVariants = {
  hidden: {
    opacity: 0,
    y: 10, // 减小位移距离，更自然
    scale: 1 // 移除缩放效果使动画更轻量
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2 }
  }
};

// -------------------- 组件实现 -------------------- 

interface PaperTableProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperTable: React.FC<PaperTableProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn(
      "w-full overflow-hidden rounded-lg border border-theme-border bg-theme-bg-secondary shadow-sm",
      className
    )}>
      <LayoutGroup>
        <table className="w-full text-sm text-left border-collapse">
          {children}
        </table>
      </LayoutGroup>
    </div>
  );
};

// Header (优化样式 - 支持多种使用模式，主题适配) 
export const PaperTableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  // 检测子元素类型，判断是否已经包含行包装
  const childArray = React.Children.toArray(children);
  const firstChild = childArray[0];

  // 检测是否已经包含 tr 或 PaperTableRow
  const hasRowWrapper = React.isValidElement(firstChild) && (
    // 原生 tr 元素
    firstChild.type === 'tr' ||
    // PaperTableRow 组件（通过 displayName 或函数名检测）
    (typeof firstChild.type === 'function' &&
      ((firstChild.type as any).displayName === 'PaperTableRow' ||
        firstChild.type.name === 'PaperTableRow' ||
        // 检测 motion.tr（framer-motion 包装）
        (firstChild.type as any).render?.name === 'PaperTableRow')
    )
  );

  // 表头样式：使用主题变量
  const theadClassName = cn(
    'bg-theme-bg-tertiary border-b border-theme-border',
    className
  );
  const trClassName = 'border-b border-theme-border';

  if (hasRowWrapper) {
    // 用户已经传入了 tr 或 PaperTableRow，不再额外包装
    return (
      <thead className={theadClassName}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            const childProps = child.props as { className?: string; children?: React.ReactNode };
            if (child.type === 'tr') {
              // 原生 tr，添加样式并为 th/td 子元素添加 isHeader
              return React.cloneElement(child as React.ReactElement<{ className?: string; children?: React.ReactNode }>, {
                className: cn(trClassName, childProps.className),
                children: React.Children.map(childProps.children, grandChild =>
                  React.isValidElement(grandChild)
                    ? React.cloneElement(grandChild as React.ReactElement<{ isHeader?: boolean }>, { isHeader: true })
                    : grandChild
                )
              });
            }
            // PaperTableRow，直接渲染（Row 内的 Cell 需要设置 isHeader）
            return React.cloneElement(child as React.ReactElement<{ className?: string; children?: React.ReactNode }>, {
              className: cn(trClassName, childProps.className),
              children: React.Children.map(childProps.children, grandChild =>
                React.isValidElement(grandChild)
                  ? React.cloneElement(grandChild as React.ReactElement<{ isHeader?: boolean }>, { isHeader: true })
                  : grandChild
              )
            });
          }
          return child;
        })}
      </thead>
    );
  }

  // 标准用法：用户直接传入 PaperTableCell，由组件包装 tr
  return (
    <thead className={theadClassName}>
      <tr className={trClassName}>
        {React.Children.map(children, child =>
          React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<{ isHeader?: boolean }>, { isHeader: true }) : child
        )}
      </tr>
    </thead>
  );
};

// Body (核心修改：添加 Variants 编排) 
export const PaperTableBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return (
    <motion.tbody
      className={cn('divide-y divide-theme-border', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode='popLayout'>
        {children}
      </AnimatePresence>
    </motion.tbody>
  );
};

// Row (核心修改：添加交互动画) 
interface PaperTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const PaperTableRow: React.FC<PaperTableRowProps> = ({
  children,
  className,
  onClick,
  selected = false
}) => {
  return (
    <motion.tr
      layout
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClick}
      className={cn(
        'group transition-colors duration-200 border-l-4 border-transparent',
        onClick && 'cursor-pointer hover:bg-theme-bg-tertiary',
        selected ? 'bg-primary-50/50 border-l-primary-500' : '',
        className
      )}
    >
      {children}
    </motion.tr>
  );
};

// Toolbar 组件
interface PaperTableToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export const PaperTableToolbar: React.FC<PaperTableToolbarProps> = ({ children, className }) => {
  return (
    <div className={cn('p-4 border-b border-theme-border', className)}>
      {children}
    </div>
  );
};

// Pagination 组件
interface PaperTablePaginationProps {
  currentPage: number;
  totalItems: number;
  totalPages?: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  className?: string;
}

export const PaperTablePagination: React.FC<PaperTablePaginationProps> = ({
  currentPage,
  totalItems,
  totalPages: propTotalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  className
}) => {
  // 计算总页数，优先使用传入的totalPages
  const totalPages = propTotalPages || Math.ceil(totalItems / itemsPerPage);

  return (
    <div className={cn('flex items-center justify-between p-4 border-t border-theme-border', className)}>
      <div className="text-sm text-theme-text-secondary">
        显示第 {(currentPage - 1) * itemsPerPage + 1} 到 {Math.min(currentPage * itemsPerPage, totalItems)} 项，共 {totalItems} 项
      </div>
      <div className="flex items-center gap-2">
        {onItemsPerPageChange && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-theme-border rounded-md bg-theme-bg-secondary text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {[10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        )}
        <div className="flex items-center">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-theme-border rounded-l-md bg-theme-bg-secondary text-theme-text-primary disabled:opacity-50 hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            上一页
          </button>
          <span className="px-3 py-1 border-t border-b border-theme-border bg-theme-bg-secondary text-theme-text-primary">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-theme-border rounded-r-md bg-theme-bg-secondary text-theme-text-primary disabled:opacity-50 hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

// Cell (保持对齐修复)
interface PaperTableCellProps {
  children: React.ReactNode;
  className?: string;
  isHeader?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  noWrap?: boolean;
  colSpan?: number;
}

export const PaperTableCell: React.FC<PaperTableCellProps> = ({
  children,
  className,
  isHeader = false,
  align = 'left',
  width,
  noWrap = false,
  colSpan
}) => {
  const Tag = isHeader ? 'th' : 'td';
  // 表头默认居中，数据行默认左对齐
  const effectiveAlign = isHeader ? (align === 'left' ? 'center' : align) : align;

  return (
    <Tag
      className={cn(
        'px-4 py-3 transition-colors', // 优化内边距
        'align-middle', // 垂直居中
        // 根据对齐属性设置文本对齐
        effectiveAlign === 'center' ? 'text-center' : effectiveAlign === 'right' ? 'text-right' : 'text-left',
        // 文本溢出处理
        noWrap ? 'whitespace-nowrap overflow-hidden text-ellipsis' : '',
        // 单元格样式 - 使用主题变量
        isHeader
          ? 'text-theme-text-secondary font-semibold text-xs uppercase tracking-wider'
          : 'text-theme-text-primary font-medium',
        className
      )}
      style={{
        width,
        minHeight: '44px',
        overflow: 'hidden'
      }}
      colSpan={colSpan}
    >
      {children}
    </Tag>
  );
};

const PaperTableWithStatics = Object.assign(PaperTable, {
  Header: PaperTableHeader,
  HeaderCell: PaperTableCell,
  Body: PaperTableBody,
  Row: PaperTableRow,
  Cell: PaperTableCell,
});

export default PaperTableWithStatics;