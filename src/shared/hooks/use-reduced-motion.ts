import { useSyncExternalStore } from 'react';

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion (WCAG 2.1 Success Criterion 2.3.3)
 * 
 * Uses useSyncExternalStore for optimal performance and SSR safety
 * 
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 * 
 * <motion.div
 *   animate={prefersReducedMotion ? undefined : { scale: 1.1 }}
 * >
 * ```
 */
export function useReducedMotion(): boolean {
    return useSyncExternalStore(
        // subscribe
        (callback) => {
            if (typeof window === 'undefined') return () => { };

            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', callback);
                return () => mediaQuery.removeEventListener('change', callback);
            }

            return () => { };
        },
        // getSnapshot
        () => {
            if (typeof window === 'undefined') return false;
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },
        // getServerSnapshot
        () => false
    );
}
