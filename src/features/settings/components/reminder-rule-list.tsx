'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';

export function ReminderRuleList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Reminder Rules</h3>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Rule
        </Button>
      </div>
      <Card>
        <CardContent>
          <div className="text-muted-foreground py-4 text-center">
            Reminder rules list not available in recovery mode.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
