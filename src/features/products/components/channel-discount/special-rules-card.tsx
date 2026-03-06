import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface SpecialRulesCardProps {
    specialRules: {
        packageNoDiscount: boolean;
        bundleSeparateDiscount: boolean;
    };
    setSpecialRules: (rules: { packageNoDiscount: boolean; bundleSeparateDiscount: boolean }) => void;
}

export function SpecialRulesCard({ specialRules, setSpecialRules }: SpecialRulesCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>特殊规则</CardTitle>
                <CardDescription>配置折扣计算的特殊规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="packageNoDiscount"
                        checked={specialRules.packageNoDiscount}
                        onCheckedChange={(checked) =>
                            setSpecialRules({ ...specialRules, packageNoDiscount: checked === true })
                        }
                    />
                    <Label htmlFor="packageNoDiscount" className="cursor-pointer">
                        套餐商品不参与渠道折扣
                        <span className="text-muted-foreground ml-2 text-sm">
                            （套餐价已是优惠价，不再叠加渠道折扣）
                        </span>
                    </Label>
                </div>
                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="bundleSeparateDiscount"
                        checked={specialRules.bundleSeparateDiscount}
                        onCheckedChange={(checked) =>
                            setSpecialRules({ ...specialRules, bundleSeparateDiscount: checked === true })
                        }
                    />
                    <Label htmlFor="bundleSeparateDiscount" className="cursor-pointer">
                        组合商品按子商品分别计算折扣
                        <span className="text-muted-foreground ml-2 text-sm">
                            （每个子商品按各自的折扣规则计算）
                        </span>
                    </Label>
                </div>
            </CardContent>
        </Card>
    );
}
