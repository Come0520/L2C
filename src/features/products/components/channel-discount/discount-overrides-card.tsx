import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import type { DiscountOverride } from '../../hooks/use-channel-discount-manager';

interface DiscountOverridesCardProps {
    overrides: DiscountOverride[];
    newOverride: {
        scope: 'CATEGORY' | 'PRODUCT';
        targetId: string;
    };
    setNewOverride: (override: { scope: 'CATEGORY' | 'PRODUCT'; targetId: string }) => void;
    addingOverride: boolean;
    onAddOverride: () => void;
    onDeleteOverride: (id: string) => void;
    onUpdateOverrideDiscount: (
        id: string,
        level: 'sLevelDiscount' | 'aLevelDiscount' | 'bLevelDiscount' | 'cLevelDiscount',
        value: number
    ) => void;
}

export function DiscountOverridesCard({
    overrides,
    newOverride,
    setNewOverride,
    addingOverride,
    onAddOverride,
    onDeleteOverride,
    onUpdateOverrideDiscount,
}: DiscountOverridesCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>品类/商品覆盖规则</CardTitle>
                <CardDescription>为特定品类或商品设置不同的折扣率，覆盖全局配置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* 新增规则 */}
                <div className="bg-muted/30 flex items-end gap-4 rounded-lg border p-4">
                    <div className="space-y-2">
                        <Label>覆盖范围</Label>
                        <Select
                            value={newOverride.scope}
                            onValueChange={(value: string) =>
                                setNewOverride({ ...newOverride, scope: value as 'CATEGORY' | 'PRODUCT' })
                            }
                        >
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CATEGORY">品类</SelectItem>
                                <SelectItem value="PRODUCT">商品</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 space-y-2">
                        <Label>选择目标</Label>
                        <Select
                            value={newOverride.targetId}
                            onValueChange={(value: string) =>
                                setNewOverride({ ...newOverride, targetId: value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={newOverride.scope === 'CATEGORY' ? '选择品类' : '选择商品'}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {newOverride.scope === 'CATEGORY' ? (
                                    <>
                                        <SelectItem value="CURTAIN_FABRIC">窗帘布料</SelectItem>
                                        <SelectItem value="CURTAIN_SHEER">窗帘纱</SelectItem>
                                        <SelectItem value="WALLCLOTH">墙布</SelectItem>
                                        <SelectItem value="CURTAIN_TRACK">窗帘轨道</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="p1">高密度遮光布-米白</SelectItem>
                                        <SelectItem value="p2">雪尼尔绒布-灰色</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={onAddOverride} disabled={addingOverride}>
                        {addingOverride ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        添加规则
                    </Button>
                </div>

                {/* 规则列表 */}
                {overrides.length > 0 && (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>范围</TableHead>
                                    <TableHead>对象</TableHead>
                                    <TableHead className="text-center">S级</TableHead>
                                    <TableHead className="text-center">A级</TableHead>
                                    <TableHead className="text-center">B级</TableHead>
                                    <TableHead className="text-center">C级</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {overrides.map((override) => (
                                    <TableRow key={override.id}>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {override.scope === 'CATEGORY' ? '品类' : '商品'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {override.targetName || override.targetId}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={200}
                                                value={override.sLevelDiscount || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    onUpdateOverrideDiscount(
                                                        override.id,
                                                        'sLevelDiscount',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="mx-auto w-16 text-center"
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={200}
                                                value={override.aLevelDiscount || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    onUpdateOverrideDiscount(
                                                        override.id,
                                                        'aLevelDiscount',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="mx-auto w-16 text-center"
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={200}
                                                value={override.bLevelDiscount || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    onUpdateOverrideDiscount(
                                                        override.id,
                                                        'bLevelDiscount',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="mx-auto w-16 text-center"
                                            />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={200}
                                                value={override.cLevelDiscount || ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    onUpdateOverrideDiscount(
                                                        override.id,
                                                        'cLevelDiscount',
                                                        Number(e.target.value)
                                                    )
                                                }
                                                className="mx-auto w-16 text-center"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDeleteOverride(override.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
