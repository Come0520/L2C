'use client';

import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/shared/ui/accordion';

export function QuoteSpaceAccordion() {
    return (
        <Accordion type="single" defaultValue="placeholder">
            <AccordionItem value="placeholder">
                <AccordionTrigger>空间列表 (Spaces)</AccordionTrigger>
                <AccordionContent>
                    空间列表在恢复模式下暂不可用。
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
