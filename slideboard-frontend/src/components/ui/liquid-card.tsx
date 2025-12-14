'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import React, { useRef } from 'react';

import { cn } from '@/lib/utils';

interface LiquidCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * LiquidCard 组件
 * 模拟液态玻璃质感的卡片组件
 * @param children - 卡片内的内容
 * @param className - 额外的样式类
 */
export const LiquidCard: React.FC<LiquidCardProps> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);

  // 1. 鼠标位置的 Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 2. 使用 Spring 让跟随更平滑（模拟液体的粘滞感）
  const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

  // 3. 将鼠标位置转换为旋转角度 (3D 倾斜效果)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-12deg", "12deg"]);

  // 4. 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // 计算鼠标在卡片内的相对位置 (范围 -0.5 到 0.5)
    const mouseXRelative = (e.clientX - rect.left) / width - 0.5;
    const mouseYRelative = (e.clientY - rect.top) / height - 0.5;

    x.set(mouseXRelative);
    y.set(mouseYRelative);
  };

  const handleMouseLeave = () => {
    // 鼠标离开时复位
    x.set(0);
    y.set(0);
  };

  // 5. 动态光照层：根据鼠标位置改变径向渐变中心
  // 这里的 250px 是光斑的大小
  const spotlightStyle = useMotionTemplate`radial-gradient(
    250px circle at ${mouseX.get() * 100 + 50}% ${mouseY.get() * 100 + 50}%,
    rgba(255, 255, 255, 0.4),
    transparent 80%
  )`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
      }}
      className={cn(
        "relative group rounded-3xl z-10",
        /* 玻璃基础材质 */
        "bg-white/5 backdrop-blur-2xl",
        /* 边框处理：利用 tailwind v4 边框透明度 */
        "border border-white/20",
        /* 初始液态阴影 */
        "shadow-[inset_0_0_20px_rgba(255,255,255,0.05),0_20px_40px_rgba(0,0,0,0.3)]",
        "transition-shadow duration-500",
        className
      )}
    >
      {/* 动态流光层 (Highlight Layer) */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{ background: spotlightStyle }}
        aria-hidden="true"
      />

      {/* 内部高光层 (模拟顶部湿润反光) */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* 内容区域 */}
      <div className="relative h-full w-full p-6 text-white transform-style-3d">
         {children}
      </div>
    </motion.div>
  );
};
