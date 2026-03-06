import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import Save from 'lucide-react/dist/esm/icons/save';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Settings from 'lucide-react/dist/esm/icons/settings';

export const CHANNEL_LEVELS = [
    { value: 'S', label: 'S级', description: '战略合作伙伴' },
    { value: 'A', label: 'A级', description: '核心渠道' },
    { value: 'B', label: 'B级', description: '普通渠道' },
    { value: 'C', label: 'C级', description: '新渠道' },
] as const;

interface GlobalDiscountCardProps {
    globalDiscounts: {
        sLevel: number;
        aLevel: number;
        bLevel: number;
        cLevel: number;
    };
    setGlobalDiscounts: (discounts: { sLevel: number; aLevel: number; bLevel: number; cLevel: number; }) => void;
    saving: boolean;
    onSave: () => void;
}

export function GlobalDiscountCard({
    globalDiscounts,
    setGlobalDiscounts,
    saving,
    onSave,
}: GlobalDiscountCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    全局默认折扣
                </CardTitle>
                <CardDescription>配置 S/A/B/C 四个等级渠道的默认折扣率（100% = 无折扣）</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 gap-4">
                    {CHANNEL_LEVELS.map((level) => (
                        <div key={level.value} className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Badge variant={level.value === 'S' ? 'default' : 'outline'}>{level.label}</Badge>
                                <span className="text-muted-foreground text-xs">{level.description}</span>
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    max={200}
                                    value={
                                        globalDiscounts[
                                        `${level.value.toLowerCase()}Level` as keyof typeof globalDiscounts
                                        ]
                                    }
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setGlobalDiscounts({
                                            ...globalDiscounts,
                                            [`${level.value.toLowerCase()}Level`]: Number(e.target.value),
                                        })
                                    }
                                    className="w-24"
                                />
                                <span className="text-muted-foreground">%</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex justify-end">
                    <Button onClick={onSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        保存全局配置
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
