"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/shared/lib/utils"

const Accordion = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div"> & { type?: "single" | "multiple"; defaultValue?: string | string[] }
>(({ className, type, defaultValue, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div"> & { value: string }
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ComponentPropsWithoutRef<"button">
>(({ className, children, ...props }, ref) => (
    <h3 className="flex">
        <button
            ref={ref}
            type="button"
            className={cn(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline group",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
    </h3>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
            className
        )}
        {...props}
    >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
