import { cn } from "@/shared/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm", className)}
            {...props}
        />
    )
}

export { Skeleton }
