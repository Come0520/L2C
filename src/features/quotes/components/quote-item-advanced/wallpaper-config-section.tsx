import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { QuoteItemAdvancedSectionProps } from './types';

export function WallpaperConfigSection({
    attributes,
    updateAttribute,
}: Pick<QuoteItemAdvancedSectionProps, 'attributes' | 'updateAttribute'>) {
    return (
        <div className="space-y-4">
            <h4 className="text-sm leading-none font-medium">墙纸/墙布参数</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>每卷长度 (Roll Length)</Label>
                    <Input
                        type="number"
                        value={(attributes.rollLength as string | number) || ''}
                        onChange={(e) => updateAttribute('rollLength', e.target.value)}
                        placeholder="1000"
                    />
                </div>
                <div className="space-y-2">
                    <Label>对花损耗 (Repeat)</Label>
                    <Input
                        type="number"
                        value={(attributes.patternRepeat as string | number) || ''}
                        onChange={(e) => updateAttribute('patternRepeat', e.target.value)}
                        placeholder="0"
                    />
                </div>
            </div>
        </div>
    );
}
