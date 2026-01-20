'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Switch } from '@/shared/ui/switch';

/**
 * 采购拆单规则配置组件
 * 定义订单如何拆分为采购单
 */

// 示例规则数据
const defaultRules = [
    {
        id: '1',
        name: '按供应商拆分',
        description: '相同供应商的产品合并到同一采购单',
        type: 'supplier',
        enabled: true,
    },
    {
        id: '2',
        name: '按产品类型拆分',
        description: '窗帘、墙纸等不同类型产品分开采购',
        type: 'product_type',
        enabled: true,
    },
    {
        id: '3',
        name: '按紧急程度拆分',
        description: '加急订单单独生成采购单',
        type: 'urgency',
        enabled: false,
    },
];

export function SplitRulesConfig() {
    const [rules, setRules] = useState(defaultRules);

    const toggleRule = (id: string) => {
        setRules(rules.map(rule =>
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        ));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    添加规则
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>规则名称</TableHead>
                        <TableHead>描述</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rules.map((rule) => (
                        <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {rule.description}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">
                                    {rule.type === 'supplier' ? '供应商' :
                                        rule.type === 'product_type' ? '产品类型' : '紧急程度'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Switch
                                    checked={rule.enabled}
                                    onCheckedChange={() => toggleRule(rule.id)}
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <Card className="border-dashed">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                        拆单规则按优先级顺序执行，首个匹配的规则将应用于订单拆分。
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
