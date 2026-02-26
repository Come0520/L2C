'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ChevronRight, ChevronDown, Plus, Edit2, PowerOff, Trash2 } from 'lucide-react';
import { ChartOfAccount, ChartOfAccountTreeNode } from '../types/account';
import { AccountCategory, ACCOUNT_CATEGORIES } from '../constants/account-categories';
import { AccountFormDialog } from './account-form-dialog';
import {
  toggleChartOfAccountStatus,
  deleteChartOfAccount,
} from '../actions/chart-of-accounts-actions';
import { toast } from 'sonner';

interface ChartOfAccountsTreeProps {
  initialData: ChartOfAccount[];
}

export function ChartOfAccountsTree({ initialData }: ChartOfAccountsTreeProps) {
  // 构建树形结构和按分类分组的数据
  const groupedTreeData = useMemo(() => {
    // 1. 构建树
    const idMapping = initialData.reduce(
      (acc, el, i) => {
        acc[el.id] = i;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const treeNodes: ChartOfAccountTreeNode[] = JSON.parse(JSON.stringify(initialData));
    const roots: ChartOfAccountTreeNode[] = [];

    treeNodes.forEach((el) => {
      if (el.parentId === null) {
        roots.push(el);
        return;
      }
      const parentEl = treeNodes[idMapping[el.parentId]];
      if (parentEl) {
        parentEl.children = [...(parentEl.children || []), el];
      }
    });

    // 2. 按大类分组
    const grouped: Record<AccountCategory, ChartOfAccountTreeNode[]> = {
      ASSET: [],
      LIABILITY: [],
      EQUITY: [],
      INCOME: [],
      EXPENSE: [],
    };

    roots.forEach((root) => {
      if (grouped[root.category]) {
        grouped[root.category].push(root);
      }
    });

    return grouped;
  }, [initialData]);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [formConfig, setFormConfig] = useState<{
    open: boolean;
    existingAccount?: ChartOfAccount | null;
    parentId?: string;
    parentCategory?: AccountCategory;
  }>({ open: false });

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleStatus = async (
    id: string,
    currentStatus: boolean,
    isSystemDefault: boolean
  ) => {
    if (isSystemDefault) {
      toast.error('系统内置科目不可停用或启用');
      return;
    }
    const res = await toggleChartOfAccountStatus(id, !currentStatus);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(currentStatus ? '已停用' : '已启用');
    }
  };

  const handleDelete = async (id: string, isSystemDefault: boolean, hasChildren: boolean) => {
    if (isSystemDefault) {
      toast.error('系统内置科目不可删除');
      return;
    }
    if (hasChildren) {
      toast.error('请先删除所有相关的层级子科目，然后再删除本节点');
      return;
    }

    if (confirm('确认删除该科目吗？此操作不可逆')) {
      const res = await deleteChartOfAccount(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('删除成功');
      }
    }
  };

  const renderRow = (node: ChartOfAccountTreeNode, levelIndex: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <TableRow key={node.id}>
        <TableCell>
          <div className="flex items-center" style={{ paddingLeft: `${levelIndex * 24}px` }}>
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="mr-1 h-6 w-6 p-0"
                onClick={() => toggleExpand(node.id)}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </Button>
            ) : (
              <div className="mr-1 w-6" />
            )}
            <span className="font-medium">{node.code}</span>
            <span className="text-muted-foreground ml-2">{node.name}</span>
          </div>
        </TableCell>
        <TableCell>{node.isSystemDefault && <Badge variant="secondary">系统内置</Badge>}</TableCell>
        <TableCell>
          <Badge variant={node.isActive ? 'default' : 'secondary'}>
            {node.isActive ? '启用' : '停用'}
          </Badge>
        </TableCell>
        <TableCell className="max-w-[200px] truncate" title={node.description || ''}>
          {node.description || '-'}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            {!node.isSystemDefault && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormConfig({
                      open: true,
                      parentId: node.id,
                      parentCategory: node.category,
                    })
                  }
                  title="添加子科目"
                >
                  <Plus size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormConfig({ open: true, existingAccount: node })}
                  title="编辑"
                >
                  <Edit2 size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(node.id, node.isActive, node.isSystemDefault)}
                  title={node.isActive ? '停用' : '启用'}
                >
                  <PowerOff
                    size={14}
                    className={node.isActive ? 'text-red-500' : 'text-green-500'}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(node.id, node.isSystemDefault, !!hasChildren)}
                  title="删除"
                >
                  <Trash2 size={14} className="text-red-500" />
                </Button>
              </>
            )}
            {node.isSystemDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFormConfig({ open: true, existingAccount: node })}
                title="编辑描述"
              >
                <Edit2 size={14} />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderTree = (nodes: ChartOfAccountTreeNode[], levelIndex: number = 0): React.ReactNode => {
    return nodes.map((node) => (
      <React.Fragment key={node.id}>
        {renderRow(node, levelIndex)}
        {expandedNodes.has(node.id) && node.children && renderTree(node.children, levelIndex + 1)}
      </React.Fragment>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setFormConfig({ open: true })}>
          <Plus className="mr-2 h-4 w-4" />
          新增顶级科目
        </Button>
      </div>

      {Object.entries(ACCOUNT_CATEGORIES).map(([category, label]) => {
        const nodes = groupedTreeData[category as AccountCategory];
        if (!nodes || nodes.length === 0) return null;

        return (
          <div key={category} className="rounded-md border">
            <div className="bg-muted px-4 py-2 font-semibold">
              {label} ({category})
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">科目</TableHead>
                  <TableHead className="w-[100px]">标识</TableHead>
                  <TableHead className="w-[100px]">状态</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTree(nodes)}</TableBody>
            </Table>
          </div>
        );
      })}

      <AccountFormDialog
        {...formConfig}
        onOpenChange={(open) => setFormConfig((prev) => ({ ...prev, open }))}
      />
    </div>
  );
}
