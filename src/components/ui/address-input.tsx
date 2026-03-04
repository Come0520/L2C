'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';

// 直接导入数据，Vite/Next.js 会自动优化
import provinces from 'china-division/dist/provinces.json';
import cities from 'china-division/dist/cities.json';
import areas from 'china-division/dist/areas.json';

export interface AddressValue {
  province?: string;
  city?: string;
  district?: string;
  detail?: string;
  fullAddress?: string;
}

interface AddressInputProps {
  value?: string | AddressValue;
  onChange?: (value: string) => void;
  onAddressChange?: (value: AddressValue) => void;
  defaultRegion?: string | null;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

// 解析初始值
const parseValue = (val: string | AddressValue | undefined): AddressValue => {
  if (!val) return {};
  if (typeof val === 'object') return val;

  // 如果是字符串，尝试简单解析（仅用于回显，复杂解析建议用专门工具）
  // 假设存的是拼接后的 fullAddress
  return { detail: val };
};

/**
 * AddressInput 智能地址组件
 * 基于 china-division 提供省市区三级联动
 * 支持根据租户 region (如 "上海市松江区") 自动预填
 */
export function AddressInput({
  value,
  onChange,
  onAddressChange,
  defaultRegion,
  className,
  disabled,
  placeholder = '请输入详细地址（街道、门牌号）',
}: AddressInputProps) {
  const [internalValue, setInternalValue] = React.useState<AddressValue>(parseValue(value));

  // 记录是否已初始化默认值，防止用户手动修改后被重新覆盖
  const hasInitializedDefault = React.useRef(false);

  // 初始化智能默认值
  React.useEffect(() => {
    if (hasInitializedDefault.current || !defaultRegion || internalValue.province) return;

    // 简单解析租户 region: "广东省深圳市" 或 "上海市"
    let defProv = '';
    let defCity = '';
    let defDist = '';

    // 优先匹配省
    const foundProv = provinces.find((p) => defaultRegion.includes(p.name));
    if (foundProv) {
      defProv = foundProv.name;
      // 匹配市
      const provCities = cities.filter((c) => c.provinceCode === foundProv.code);
      const foundCity = provCities.find((c) => defaultRegion.includes(c.name));
      if (foundCity) {
        defCity = foundCity.name;
        // 匹配区
        const cityAreas = areas.filter((a) => a.cityCode === foundCity.code);
        const foundDist = cityAreas.find((a) => defaultRegion.includes(a.name));
        if (foundDist) defDist = foundDist.name;
      }
    }

    if (defProv) {
      setInternalValue((prev) => ({
        ...prev,
        province: defProv,
        city: defCity,
        district: defDist,
      }));
      hasInitializedDefault.current = true;
    }
  }, [defaultRegion, internalValue.province]);

  // 同步外部 value 变化
  React.useEffect(() => {
    if (typeof value === 'string' && value !== internalValue.detail && !internalValue.province) {
      setInternalValue({ detail: value });
    }
  }, [value, internalValue.detail, internalValue.province]);

  const updateAddress = (updates: Partial<AddressValue>) => {
    const newValue = { ...internalValue, ...updates };

    // 如果修改了上级，清空下级
    if (updates.province && updates.province !== internalValue.province) {
      newValue.city = '';
      newValue.district = '';
    } else if (updates.city && updates.city !== internalValue.city) {
      newValue.district = '';
    }

    // 计算 fullAddress
    const full = [newValue.province, newValue.city, newValue.district, newValue.detail]
      .filter(Boolean)
      .join('');

    const finalValue = { ...newValue, fullAddress: full };
    setInternalValue(finalValue);

    // 主要是为了兼容当前项目的 string 字段
    onChange?.(full);
    onAddressChange?.(finalValue);
  };

  // 根据当前选择获取列表
  const currentCities = React.useMemo(() => {
    if (!internalValue.province) return [];
    const prov = provinces.find((p) => p.name === internalValue.province);
    return prov ? cities.filter((c) => c.provinceCode === prov.code) : [];
  }, [internalValue.province]);

  const currentAreas = React.useMemo(() => {
    if (!internalValue.city) return [];
    const city = cities.find((c) => c.name === internalValue.city);
    return city ? areas.filter((a) => a.cityCode === city.code) : [];
  }, [internalValue.city]);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-2">
        {/* 省份 */}
        <div className="min-w-[120px] flex-1">
          <Select
            value={internalValue.province}
            onValueChange={(v) => updateAddress({ province: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择省份" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p.code} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 城市 */}
        <div className="min-w-[120px] flex-1">
          <Select
            value={internalValue.city}
            onValueChange={(v) => updateAddress({ city: v })}
            disabled={disabled || !internalValue.province}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择城市" />
            </SelectTrigger>
            <SelectContent>
              {currentCities.map((c) => (
                <SelectItem key={c.code} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 区县 */}
        <div className="min-w-[120px] flex-1">
          <Select
            value={internalValue.district}
            onValueChange={(v) => updateAddress({ district: v })}
            disabled={disabled || !internalValue.city}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择区县" />
            </SelectTrigger>
            <SelectContent>
              {currentAreas.map((a) => (
                <SelectItem key={a.code} value={a.name}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 详细地址 */}
      <Input
        placeholder={placeholder}
        value={internalValue.detail || ''}
        onChange={(e) => updateAddress({ detail: e.target.value })}
        disabled={disabled}
      />
    </div>
  );
}
