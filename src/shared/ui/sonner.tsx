/**
 * Toast 通知配置
 */

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            data-testid="toast-container"
            theme="system"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        'group toast glass-liquid !bg-white/70 dark:!bg-black/70 !border-white/20 !shadow-glass-lg rounded-2xl p-4 flex gap-3 items-center',
                    description: 'text-muted-foreground font-sans',
                    actionButton:
                        'bg-primary text-primary-foreground font-medium rounded-lg px-3 py-1.5',
                    cancelButton:
                        'bg-muted text-muted-foreground font-medium rounded-lg px-3 py-1.5',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
