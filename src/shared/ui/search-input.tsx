import { Search, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export function SearchInput({ value, onClear, className, ...props }: SearchInputProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
      <Input {...props} value={value} className={`pr-9 pl-9 ${className || ''}`} />
      {value && onClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          onClick={onClear}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
