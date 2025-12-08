
import { motion } from 'framer-motion';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

export const PaperButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  className = '',
  icon,
  loading,
  disabled,
  ...props
}) => {
  const baseClasses = 'rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-blue-600 dark:hover:bg-blue-500 dark:text-white shadow-sm dark:shadow-[0_0_15px_rgba(37,99,235,0.3)]',
    secondary: 'bg-paper-100 text-primary-600 hover:bg-primary-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700',
    outline: 'border border-paper-600 text-ink-800 hover:bg-paper-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white',
    ghost: 'bg-transparent text-ink-800 hover:bg-paper-50 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800',
    success: 'bg-success-500 text-white hover:bg-success-600 dark:bg-emerald-600 dark:hover:bg-emerald-500',
    warning: 'bg-warning-500 text-white hover:bg-warning-600 dark:bg-amber-600 dark:hover:bg-amber-500',
    error: 'bg-error-500 text-white hover:bg-error-600 dark:bg-rose-600 dark:hover:bg-rose-500',
    info: 'bg-info-500 text-white hover:bg-info-600 dark:bg-sky-600 dark:hover:bg-sky-500',
  };

  const sizeClasses = {
    small: 'px-3 py-1 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };
  const resolvedSize = size === 'sm' ? 'small' : size === 'md' ? 'medium' : size === 'lg' ? 'large' : size;

  // Extract animation-related props to avoid type conflicts
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onAnimationStart: _1, onAnimationEnd: _2, onAnimationIteration: _3, ...restProps } = props;

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[resolvedSize as keyof typeof sizeClasses]} ${className} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...restProps as any}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon}
      {children}
    </motion.button>
  );
};
