'use client';

import { Switch } from '@/shared/ui/switch';
import { Label } from '@/shared/ui/label';
import type { BaseMemberToggles } from '@/features/settings/lib/base-member-toggles';

interface BaseMemberTogglesSectionProps {
  /** 当前开关状态 */
  toggles: BaseMemberToggles;
  /** 开关变更回调 */
  onChange: (toggles: BaseMemberToggles) => void;
  /** 是否禁用（只读展示） */
  disabled?: boolean;
}

/** 开关项配置 */
const TOGGLE_ITEMS: {
  key: keyof BaseMemberToggles;
  label: string;
  description: string;
}[] = [
  {
    key: 'isPartner',
    label: '合伙人（销售）',
    description: '开启后该成员可作为销售人员开展业务',
  },
  {
    key: 'allowFinance',
    label: '财务权限',
    description: '开启后可访问财务对账、收付款等模块',
  },
  {
    key: 'allowDispatch',
    label: '派工权限',
    description: '开启后可访问安装派工、工单管理等模块',
  },
  {
    key: 'allowSupply',
    label: '库存供应链',
    description: '开启后可访问采购、库存等供应链模块',
  },
  {
    key: 'allowStoreSharing',
    label: '跨店共享展厅',
    description: '开启后可访问其他门店共享的展厅数据',
  },
];

/**
 * Base 版权限虚拟开关区块
 * 用于替代 Pro/Enterprise 版的角色选择器，以更直观的开关方式配置成员权限
 */
export function BaseMemberTogglesSection({
  toggles,
  onChange,
  disabled = false,
}: BaseMemberTogglesSectionProps) {
  const handleToggle = (key: keyof BaseMemberToggles, value: boolean) => {
    onChange({ ...toggles, [key]: value });
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">功能权限</Label>
      <div className="divide-y rounded-md border">
        {TOGGLE_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between px-4 py-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
            <Switch
              id={`toggle-${item.key}`}
              checked={toggles[item.key]}
              onCheckedChange={(val) => handleToggle(item.key, val)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
