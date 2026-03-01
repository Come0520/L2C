import { FileSearch } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';

export interface FinanceEmptyStateProps {
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function FinanceEmptyState({ title, description, action }: FinanceEmptyStateProps) {
    return (
        <Card className="flex h-[450px] w-full flex-col items-center justify-center p-8 text-center border-dashed">
            <CardContent className="flex flex-col items-center justify-center space-y-4 pb-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <FileSearch className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold tracking-tight text-xl">{title}</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {description}
                    </p>
                </div>
                {action && <div className="pt-4">{action}</div>}
            </CardContent>
        </Card>
    );
}
