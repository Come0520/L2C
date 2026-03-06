import { Loader2 } from 'lucide-react';
import { useChannelDiscountManager } from '../hooks/use-channel-discount-manager';
import { GlobalDiscountCard } from './channel-discount/global-discount-card';
import { DiscountOverridesCard } from './channel-discount/discount-overrides-card';
import { SpecialRulesCard } from './channel-discount/special-rules-card';

/**
 * 渠道等级折扣管理组件
 *
 * 功能：
 * - 配置全局默认折扣率
 * - 按品类/商品覆盖折扣率
 * - 特殊规则配置
 */
export function ChannelDiscountManager() {
  const {
    loading,
    saving,
    globalDiscounts,
    setGlobalDiscounts,
    overrides,
    specialRules,
    setSpecialRules,
    newOverride,
    setNewOverride,
    addingOverride,
    handleSaveGlobal,
    handleAddOverride,
    handleDeleteOverride,
    handleUpdateOverrideDiscount,
  } = useChannelDiscountManager();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlobalDiscountCard
        globalDiscounts={globalDiscounts}
        setGlobalDiscounts={setGlobalDiscounts}
        saving={saving}
        onSave={handleSaveGlobal}
      />

      <DiscountOverridesCard
        overrides={overrides}
        newOverride={newOverride}
        setNewOverride={setNewOverride}
        addingOverride={addingOverride}
        onAddOverride={handleAddOverride}
        onDeleteOverride={handleDeleteOverride}
        onUpdateOverrideDiscount={handleUpdateOverrideDiscount}
      />

      <SpecialRulesCard
        specialRules={specialRules}
        setSpecialRules={setSpecialRules}
      />
    </div>
  );
}
