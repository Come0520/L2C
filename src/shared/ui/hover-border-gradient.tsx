"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

export const HoverBorderGradient = ({
    children,
    containerClassName,
    className,
    as: Tag = "button",
    duration = 1,
    clockwise = true,
    ...props
}: {
    children: React.ReactNode;
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
} & React.HTMLAttributes<HTMLElement>) => {
    const [hovered, setHovered] = useState<boolean>(false);
    const [direction, setDirection] = useState<Direction>("TOP");

    const rotateDirection = useCallback((currentDirection: Direction) => {
        const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
        const index = directions.indexOf(currentDirection);
        const nextIndex = clockwise
            ? (index - 1 + directions.length) % directions.length
            : (index + 1) % directions.length;
        return directions[nextIndex];
    }, [clockwise]);

    const movingMap: Record<Direction, string> = {
        TOP: "radial-gradient(20.7% 50% at 50% 0%, #3275F8 0%, rgba(50, 117, 248, 0) 100%)",
        LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, #3275F8 0%, rgba(50, 117, 248, 0) 100%)",
        BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, #3275F8 0%, rgba(50, 117, 248, 0) 100%)",
        RIGHT: "radial-gradient(16.2% 41.1% at 100% 50%, #3275F8 0%, rgba(50, 117, 248, 0) 100%)",
    };

    const highlight =
        "radial-gradient(75% 181.15942028985506% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)";

    useEffect(() => {
        if (!hovered) {
            const interval = setInterval(() => {
                setDirection((prevState) => rotateDirection(prevState));
            }, duration * 1000);
            return () => clearInterval(interval);
        }
    }, [hovered, duration, rotateDirection]);

    const Component = Tag as React.ElementType<React.HTMLAttributes<HTMLElement>>;
    return (
        <Component
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                "relative flex h-min w-fit flex-col flex-nowrap items-center justify-center overflow-visible rounded-full border bg-neutral-900/10 px-4 py-2 text-neutral-900 transition duration-500 hover:bg-neutral-900/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20",
                containerClassName
            )}
            {...props as React.HTMLAttributes<HTMLElement>}
        >
            <div
                className={cn(
                    "z-10 w-auto rounded-[inherit] bg-white px-4 py-2 text-neutral-900 dark:bg-black dark:text-white",
                    className
                )}
            >
                {children}
            </div>
            <motion.div
                className={cn(
                    "absolute inset-0 z-0 flex-none overflow-hidden rounded-[inherit]"
                )}
                style={{
                    filter: "blur(2px)",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                }}
                initial={{ background: movingMap[direction] }}
                animate={{
                    background: hovered
                        ? [movingMap[direction], highlight]
                        : movingMap[direction],
                }}
                transition={{ ease: "linear", duration: duration ?? 1 }}
            />
            <div className="bg-[black] absolute inset-[2px] z-1 flex-none rounded-[inherit]" />
            <div className="bg-[black] absolute inset-[2px] z-1 flex-none rounded-[inherit]" />
        </Component>
    );
};
