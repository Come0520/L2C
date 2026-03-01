import { FileSearch } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';

export interface FinanceEmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function FinanceEmptyState({ title, description, action }: FinanceEmptyStateProps) {
  return (
    <Card className="flex h-[450px] w-full flex-col items-center justify-center border-dashed p-8 text-center">
      <CardContent className="flex flex-col items-center justify-center space-y-4 pb-0">
        <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
          <FileSearch className="text-muted-foreground h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
        </div>
        {action && <div className="pt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
