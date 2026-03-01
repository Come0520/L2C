'use client';

import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Form } from '@/shared/ui/form';

export function WorkflowConfigForm() {
  const form = useForm();
  return (
    <Form {...form}>
      <form>
        <Card>
          <CardHeader>
            <CardTitle>Workflow Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground py-4 text-center">
              Workflow configuration not available in recovery mode.
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
