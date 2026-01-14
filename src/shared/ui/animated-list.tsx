"use client";

import React, { useRef, useState, useEffect, useCallback, ReactNode, MouseEventHandler, UIEvent } from 'react';
import { motion } from 'framer-motion';
import { cn } from "@/shared/lib/utils";

interface AnimatedItemProps {
    children: ReactNode;
    delay?: number;
    index: number;
    onMouseEnter?: MouseEventHandler<HTMLDivElement>;
    onClick?: MouseEventHandler<HTMLDivElement>;
}

export const AnimatedItem: React.FC<AnimatedItemProps> = ({ children, delay = 0, index, onMouseEnter, onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: -20, y: 20 }}
            whileInView={{
                opacity: 1,
                scale: 1,
                rotateX: 0,
                y: 0,
                transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: delay,
                    mass: 0.8
                }
            }}
            viewport={{
                once: false,
                margin: "0px", // Trigger immediately
                amount: 0.1
            }}
            data-index={index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            className="cursor-pointer origin-center transform-gpu"
            style={{ perspective: 1000 }}
        >
            {children}
        </motion.div>
    );
};

export interface AnimatedListProps {
    items: ReactNode[];
    onItemSelect?: (index: number) => void;
    showGradients?: boolean;
    enableArrowNavigation?: boolean;
    className?: string;
    itemClassName?: string;
    displayScrollbar?: boolean;
    initialSelectedIndex?: number;
}

export const AnimatedList: React.FC<AnimatedListProps> = ({
    items,
    onItemSelect,
    showGradients = true,
    enableArrowNavigation = true,
    className = '',
    itemClassName = '',
    displayScrollbar = true,
    initialSelectedIndex = -1
}) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
    const keyboardNavRef = useRef<boolean>(false);
    const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(1);

    const handleItemMouseEnter = useCallback((index: number) => {
        setSelectedIndex(index);
        keyboardNavRef.current = false;
    }, []);

    const handleItemClick = useCallback(
        (index: number) => {
            setSelectedIndex(index);
            keyboardNavRef.current = false;
            if (onItemSelect) {
                onItemSelect(index);
            }
        },
        [onItemSelect]
    );

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
        setTopGradientOpacity(Math.min(scrollTop / 50, 1));
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
    };

    useEffect(() => {
        if (!enableArrowNavigation) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                keyboardNavRef.current = true;
                setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
            } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                e.preventDefault();
                keyboardNavRef.current = true;
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && selectedIndex < items.length) {
                    e.preventDefault();
                    if (onItemSelect) {
                        onItemSelect(selectedIndex);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIndex, onItemSelect, enableArrowNavigation]);

    useEffect(() => {
        if (!keyboardNavRef.current || selectedIndex < 0 || !listRef.current) return;
        const container = listRef.current;

        // Use requestAnimationFrame to defer scrolling until after layout update
        requestAnimationFrame(() => {
            const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
            if (selectedItem) {
                const extraMargin = 50;
                const containerScrollTop = container.scrollTop;
                const containerHeight = container.clientHeight;
                const itemTop = selectedItem.offsetTop;
                const itemBottom = itemTop + selectedItem.offsetHeight;

                if (itemTop < containerScrollTop + extraMargin) {
                    container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
                } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
                    container.scrollTo({
                        top: itemBottom - containerHeight + extraMargin,
                        behavior: 'smooth'
                    });
                }
            }
            keyboardNavRef.current = false;
        });
    }, [selectedIndex]);

    return (
        <div className={cn("relative h-full", className)}>
            <div
                ref={listRef}
                className={cn(
                    "max-h-full h-full overflow-y-auto pr-1 pb-20",
                    displayScrollbar
                        ? "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300/50 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700/50 [&::-webkit-scrollbar-thumb]:rounded-full"
                        : "scrollbar-hide"
                )}
                onScroll={handleScroll}
            >
                {items.map((child, index) => (
                    <AnimatedItem
                        key={index}
                        delay={0.02 * index}
                        index={index}
                        onMouseEnter={() => handleItemMouseEnter(index)}
                        onClick={() => handleItemClick(index)}
                    >
                        <div className={cn(
                            "transition-all duration-200 rounded-lg",
                            selectedIndex === index ? "bg-white/5 translate-x-1" : "",
                            itemClassName
                        )}>
                            {child}
                        </div>
                    </AnimatedItem>
                ))}
            </div>
            {showGradients && (
                <>
                    <div
                        className="absolute top-0 left-0 right-0 h-[30px] bg-linear-to-b from-neutral-50 dark:from-neutral-900 to-transparent pointer-events-none transition-opacity duration-300 ease z-10"
                        style={{ opacity: topGradientOpacity }}
                    ></div>
                    <div
                        className="absolute bottom-0 left-0 right-0 h-[40px] bg-linear-to-t from-neutral-50 dark:from-neutral-900 to-transparent pointer-events-none transition-opacity duration-300 ease z-10"
                        style={{ opacity: bottomGradientOpacity }}
                    ></div>
                </>
            )}
        </div>
    );
};
