'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/shared/ui/button';
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
                        <div className="py-4 text-center text-muted-foreground">
                            Workflow configuration not available in recovery mode.
                        </div>
                    </CardContent>
                </Card>
            </form> 
        </Form>
    );
}
