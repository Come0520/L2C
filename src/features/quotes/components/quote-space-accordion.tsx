'use client';

import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/shared/components/ui/accordion';

export function QuoteSpaceAccordion() {
    return (
        <Accordion type="single" collapsible>
            <AccordionItem value="placeholder">
                <AccordionTrigger>空间列表 (Spaces)</AccordionTrigger>
                <AccordionContent>
                    空间列表在恢复模式下暂不可用。
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
