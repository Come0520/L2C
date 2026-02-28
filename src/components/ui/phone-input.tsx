'use client';

import * as React from 'react';
import * as RPNInput from 'react-phone-number-input/input';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import type { Country, Value as RPNValue } from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

type PhoneInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value?: string;
  onChange?: (value: string | undefined) => void;
  defaultCountry?: Country;
};

/**
 * 电话号码输入组件
 * 包含国家/地区代码选择器和电话号码输入框
 */
const PhoneInput = React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
  ({ className, onChange, value, defaultCountry = 'CN', ...props }, ref) => {
    // 内部管理当前选中的国家/地区
    const [country, setCountry] = React.useState<Country>(defaultCountry);

    /**
     * 兼容旧数据：将非 E.164 格式的电话号码智能转换
     * 1. 已有 "+" 前缀 → 原样返回 + 反推国家
     * 2. 纯数字 → 尝试作为默认国家的本地号码解析
     * 3. 解析失败（号码无效） → 返回 undefined，避免组件报错
     */
    const { normalizedValue, detectedCountry } = React.useMemo(() => {
      if (!value) return { normalizedValue: undefined, detectedCountry: undefined };

      // 情况 1：已有 E.164 格式
      if (value.startsWith('+')) {
        const parsed = parsePhoneNumberFromString(value);
        return {
          normalizedValue: value,
          detectedCountry: parsed?.country || undefined,
        };
      }

      // 情况 2：纯数字，尝试作为默认国家的本地号码解析
      const digits = value.replace(/\D/g, '');
      if (!digits) return { normalizedValue: undefined, detectedCountry: undefined };

      // 用 parsePhoneNumberFromString 正确地解析为 E.164
      const parsed = parsePhoneNumberFromString(digits, defaultCountry);
      if (parsed && parsed.isValid()) {
        return {
          normalizedValue: parsed.number,
          detectedCountry: parsed.country || undefined,
        };
      }

      // 情况 3：无效号码，手动拼接但带上正确国家码
      const callingCode = getCountryCallingCode(defaultCountry);
      return {
        normalizedValue: `+${callingCode}${digits}`,
        detectedCountry: defaultCountry,
      };
    }, [value, defaultCountry]);

    // 同步国旗：确保 country state 和号码的实际国家一致
    React.useEffect(() => {
      if (detectedCountry && detectedCountry !== country) {
        setCountry(detectedCountry);
      }
    }, [detectedCountry]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div
        className={cn(
          'border-input bg-background ring-offset-background flex h-10 w-full rounded-md border text-sm',
          'focus-within:ring-primary focus-within:ring-2 focus-within:ring-offset-2',
          '[&:has(:disabled)]:cursor-not-allowed [&:has(:disabled)]:opacity-50',
          className
        )}
      >
        <CountrySelect
          value={country}
          onChange={(newCountry) => {
            setCountry(newCountry);
          }}
          disabled={props.disabled}
        />
        <RPNInput.default
          ref={ref as React.Ref<HTMLInputElement>}
          className={cn(
            'placeholder:text-muted-foreground flex-1 border-0 bg-transparent px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            '[&_.PhoneInputInput]:border-none [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:outline-none'
          )}
          international
          country={country}
          value={normalizedValue as RPNValue}
          onChange={(val) => onChange?.(val as string | undefined)}
          {...props}
        />
      </div>
    );
  }
);
PhoneInput.displayName = 'PhoneInput';

type CountrySelectOption = { label: string; value: Country; code: string };

interface CountrySelectProps {
  disabled?: boolean;
  value: Country;
  onChange: (value: Country) => void;
  options?: CountrySelectOption[];
}

/**
 * 国家/地区选择器组件
 * 使用 Shadcn Popover + Command 组合
 * 关键：Popover 设置 modal={true}，使其在 Dialog 内部时能正确接管焦点和点击事件
 */
const CountrySelect = ({ disabled, value, onChange, options }: CountrySelectProps) => {
  const [open, setOpen] = React.useState(false);

  // 生成国家列表，使用中文名称
  const countries = React.useMemo(() => {
    if (options) return options;
    const displayNames = new Intl.DisplayNames(['zh-CN'], { type: 'region' });
    return getCountries().map((country) => {
      const countryCode = getCountryCallingCode(country);
      return {
        label: displayNames.of(country) || country,
        value: country,
        code: `+${countryCode}`,
      };
    });
  }, [options]);

  const selectedCountry = countries.find((c) => c.value === value) || countries[0];

  return (
    // modal={true} 让 Popover 创建自己的模态层，能正确穿透 Dialog 的焦点陷阱
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn(
            'border-input flex shrink-0 gap-1 rounded-e-none border-y-0 border-r border-l-0 bg-transparent px-3 hover:bg-zinc-100 hover:text-zinc-900 focus:border-r focus:ring-0 focus-visible:outline-none',
            !value && 'text-muted-foreground'
          )}
        >
          <FlagComponent country={selectedCountry.value} countryName={selectedCountry.label} />
          <ChevronsUpDown
            className={cn('ml-1 h-4 w-4 shrink-0 opacity-50', disabled ? 'hidden' : 'opacity-100')}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] border bg-white! p-0 shadow-lg dark:bg-zinc-950!"
        align="start"
      >
        <Command>
          <CommandInput placeholder="搜索国家或区号..." />
          <CommandList>
            <CommandEmpty>未找到匹配的国家。</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={`${country.label} ${country.code}`}
                  onSelect={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <FlagComponent country={country.value} countryName={country.label} />
                  <span className="flex-1 text-sm">{country.label}</span>
                  <span className="text-muted-foreground w-12 text-right text-sm">
                    {country.code}
                  </span>
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      value === country.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

/** 国旗图标组件 */
const FlagComponent = ({ country, countryName }: { country: Country; countryName: string }) => {
  const FlagElement = flags[country] as React.ElementType<{ title: string; className?: string }>;

  return (
    <span className="bg-muted/50 flex h-4 w-6 items-center justify-center overflow-hidden rounded-sm shadow-sm">
      {FlagElement && <FlagElement title={countryName} className="h-full w-full object-cover" />}
    </span>
  );
};

export { PhoneInput };
