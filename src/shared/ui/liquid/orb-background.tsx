'use client';

import { motion } from 'framer-motion';
import { cn } from '@/shared/lib/utils';

export const OrbBackground = ({
    className,
    children
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div className={cn("fixed inset-0 w-full h-full overflow-hidden bg-slate-950 -z-50", className)}>
            {/* Orb 1: Purple/Blue */}
            <motion.div
                initial={{ x: -100, y: -100, opacity: 0 }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                    opacity: 0.6
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                }}
                className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] mix-blend-screen"
            />

            {/* Orb 2: Cyan/Teal */}
            <motion.div
                initial={{ x: '100vw', y: 0, opacity: 0 }}
                animate={{
                    x: ['80vw', '60vw', '80vw'],
                    y: [0, 100, 0],
                    scale: [1, 1.5, 1],
                    opacity: 0.5
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-cyan-500/20 rounded-full blur-[90px] mix-blend-screen"
            />

            {/* Orb 3: Pink/Red */}
            <motion.div
                initial={{ x: '50vw', y: '100vh', opacity: 0 }}
                animate={{
                    x: ['40vw', '60vw', '40vw'],
                    y: ['80vh', '60vh', '80vh'],
                    scale: [1, 1.3, 1],
                    opacity: 0.4
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: 5
                }}
                className="absolute bottom-0 left-[20%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] mix-blend-screen"
            />

            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
            {children}
        </div>
    );
};
