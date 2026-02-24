'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';

export type ShowroomItem = {
  id: string;
  title: string;
  category: 'product' | 'case';
  price?: string;
  image: string;
  status: 'published' | 'draft';
};

const data: ShowroomItem[] = [
  {
    id: '1',
    title: '西湖壹号 - 现代极简',
    category: 'case',
    image: 'https://picsum.photos/400/600',
    status: 'published',
  },
  {
    id: '2',
    title: '意大利进口绒布 - 皇家蓝',
    category: 'product',
    price: '¥280/m',
    image: 'https://picsum.photos/400/500',
    status: 'published',
  },
  {
    id: '3',
    title: '阳光海岸 - 法式浪漫',
    category: 'case',
    image: 'https://picsum.photos/400/550',
    status: 'published',
  },
  {
    id: '4',
    title: '高精密遮光布 - 奶咖色',
    category: 'product',
    price: '¥120/m',
    image: 'https://picsum.photos/400/400',
    status: 'draft',
  },
];

export const columns: ColumnDef<ShowroomItem>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'image',
    header: '预览',
    cell: ({ row }) => (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={row.getValue('image')}
        alt="preview"
        className="h-12 w-12 rounded-md border object-cover"
      />
    ),
  },
  {
    accessorKey: 'title',
    header: '标题',
    cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'category',
    header: '分类',
    cell: ({ row }) => {
      const type = row.getValue('category') as string;
      return (
        <Badge variant={type === 'product' ? 'default' : 'secondary'}>
          {type === 'product' ? '商品' : '案例'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'price',
    header: '价格/标签',
    cell: ({ row }) => <div>{row.getValue('price') || '-'}</div>,
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => <Badge variant="outline">{row.getValue('status')}</Badge>,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
              复制 ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>编辑信息</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">删除素材</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

/**
 * 展厅素材列表视图 (表格模式)
 * 供管理后台使用的备选展示方案。
 * 
 * [TODO] 当前使用硬编码演示数据，生产环境下应接入 getShowroomItems Action。
 */
export function ShowroomTable() {
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input placeholder="搜索素材..." className="max-w-sm" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-[400px] text-center">
                  <div className="flex flex-col items-center justify-center space-y-4 py-10">
                    <span className="text-4xl text-muted-foreground/30">🕸️</span>
                    <h3 className="text-lg font-medium text-muted-foreground">空空如也</h3>
                    <p className="text-sm text-muted-foreground/60 max-w-sm text-center">
                      这里还没有任何展厅素材数据，试着添加一些或者清除筛选条件吧。
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          已选 {table.getFilteredSelectedRowModel().rows.length} / 共 {' '}
          {table.getFilteredRowModel().rows.length} 行数据
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  );
}
