"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import {
    Sidebar,
    SidebarBody,
    useSidebar,
} from "@/components/ui/sidebar";
import Home from 'lucide-react/dist/esm/icons/home';
import Users from 'lucide-react/dist/esm/icons/users';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import ShoppingCart from 'lucide-react/dist/esm/icons/shopping-cart';
import BarChart2 from 'lucide-react/dist/esm/icons/bar-chart-2';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Ruler from 'lucide-react/dist/esm/icons/ruler';
import Wrench from 'lucide-react/dist/esm/icons/wrench';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Headphones from 'lucide-react/dist/esm/icons/headphones';
import Truck from 'lucide-react/dist/esm/icons/truck';

import { motion } from "motion/react";
import { AnimatedList } from "@/shared/ui/animated-list";
import { LogoWithThemeSwitcher } from "@/shared/ui/theme-pill-nav";

/**
 * 导航链接配置
 * 各模块入口，使用 lucide-react 图标
 */
const navLinks = [
    {
        label: "工作台",
        href: "/",
        icon: Home,
    },
    {
        label: "线索管理",
        href: "/leads",
        icon: Users,
    },
    {
        label: "报价管理",
        href: "/quotes",
        icon: FileText,
    },
    {
        label: "订单管理",
        href: "/orders",
        icon: ShoppingCart,
    },
    {
        label: "测量服务",
        href: "/service/measurement",
        icon: Ruler,
    },
    {
        label: "安装服务",
        href: "/service/installation",
        icon: Wrench,
    },
    {
        label: "供应链",
        href: "/supply-chain",
        icon: Truck,
    },
    {
        label: "财务中心",
        href: "/finance",
        icon: DollarSign,
    },
    {
        label: "售后服务",
        href: "/after-sales",
        icon: Headphones,
    },
    {
        label: "数据分析",
        href: "/analytics",
        icon: BarChart2,
    },
    {
        label: "系统设置",
        href: "/settings",
        icon: Settings,
    },
];

/**
 * 应用侧边栏导航组件
 * 使用 Aceternity UI Sidebar 实现悬停展开效果
 */
export function AppSidebar() {
    const pathname = usePathname();
    const [open, setOpen] = React.useState(false);

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-6 glass-liquid border-r border-white/10 dark:border-white/5">
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Logo 带主题切换 */}
                    <div className="px-2 pb-4 border-b border-white/10 dark:border-white/5">
                        <LogoWrapper />
                    </div>

                    {/* 导航链接 - 使用 AnimatedList */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden mt-4 px-1">
                        <AnimatedList
                            items={navLinks.map((link, index) => {
                                const isActive = pathname === link.href ||
                                    (link.href !== "/" && pathname.startsWith(link.href));
                                return (
                                    <NavLink
                                        key={link.href}
                                        href={link.href}
                                        label={link.label}
                                        icon={link.icon}
                                        isActive={isActive}
                                    />
                                );
                            })}
                            showGradients={false}
                            enableArrowNavigation={false}
                            displayScrollbar={true}
                            itemClassName="mb-1"
                        />
                    </div>
                </div>

                {/* 底部用户信息 */}
                <div className="border-t border-white/10 dark:border-white/5 pt-4 px-2">
                    <NavLink
                        href="/settings/preferences"
                        label="个人设置"
                        icon={() => (
                            <div className="h-7 w-7 shrink-0 rounded-full bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                                U
                            </div>
                        )}
                        isActive={false}
                    />
                </div>
            </SidebarBody>
        </Sidebar>
    );
}

/**
 * Logo 包装组件（根据展开状态显示/隐藏标题）
 */
function LogoWrapper() {
    const { open, animate } = useSidebar();

    return (
        <div className={cn(
            "flex items-center transition-all duration-300",
            animate && !open ? "justify-center" : "justify-start gap-3"
        )}>
            <LogoWithThemeSwitcher />
            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="font-serif font-semibold text-xl bg-linear-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent whitespace-pre"
            >
                L2C System
            </motion.span>
        </div>
    );
}

/**
 * 导航链接项组件
 * 放大了字体尺寸 (text-base)
 */
function NavLink({
    href,
    label,
    icon: Icon,
    isActive,
}: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
}) {
    const { open, animate } = useSidebar();

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center py-2.5 px-3 rounded-xl transition-all duration-300 group/sidebar",
                animate && !open ? "justify-center" : "justify-start gap-3",
                isActive
                    ? "bg-primary-500/20 text-primary-600 dark:text-primary-400"
                    : "text-neutral-700 dark:text-neutral-200 hover:bg-white/10 dark:hover:bg-white/5"
            )}
        >
            <Icon className={cn(
                "h-5 w-5 shrink-0 transition-colors",
                isActive ? "text-primary-600 dark:text-primary-400" : "text-neutral-500 dark:text-neutral-400"
            )} />
            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className={cn(
                    "text-base font-medium group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre",
                    isActive ? "text-primary-600 dark:text-primary-400" : ""
                )}
            >
                {label}
            </motion.span>
        </Link>
    );
}

// 默认导出以保持向后兼容
export { AppSidebar as Sidebar };
