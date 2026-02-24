import { Search, X } from 'lucide-react';
import { Input } from './input';
import { Button } from './button';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onClear?: () => void;
}

export function SearchInput({ value, onClear, className, ...props }: SearchInputProps) {
    return (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
                {...props}
                value={value}
                className={`pl-9 pr-9 ${className || ''}`}
            />
            {value && onClear && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                    onClick={onClear}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}
