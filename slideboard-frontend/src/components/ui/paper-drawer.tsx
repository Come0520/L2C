'use client'

import React from 'react'

import { cn } from '@/utils/lib-utils'

interface PaperDrawerProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
    title?: string
    position?: 'left' | 'right'
    width?: 'sm' | 'md' | 'lg' | 'xl'
}

export const PaperDrawer: React.FC<PaperDrawerProps> = ({
    isOpen,
    onClose,
    children,
    title,
    position = 'right',
    width = 'lg'
}) => {
    const widthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    }

    const positionClasses = {
        left: 'left-0',
        right: 'right-0'
    }

    const transformClasses = {
        left: isOpen ? 'translate-x-0' : '-translate-x-full',
        right: isOpen ? 'translate-x-0' : 'translate-x-full'
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    'fixed top-0 bottom-0 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out w-full',
                    positionClasses[position],
                    widthClasses[width],
                    transformClasses[position]
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-paper-300">
                        <h2 className="text-xl font-semibold text-ink-800">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-ink-400 hover:text-ink-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto h-full pb-6">
                    {children}
                </div>
            </div>
        </>
    )
}
