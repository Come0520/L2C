"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../shared/utils";
import {
    Home, Users, FileText, ShoppingCart, 
    BarChart2, Settings, Package, Menu, X
} from "lucide-react";

export function Sidebar() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const links = [
        { label: "Dashboard", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
        { label: "Leads", href: "/leads", icon: <Users className="h-5 w-5" /> },
        { label: "Quotes", href: "/quotes", icon: <FileText className="h-5 w-5" /> },
        { label: "Orders", href: "/orders", icon: <ShoppingCart className="h-5 w-5" /> },
        { label: "Inventory", href: "/inventory", icon: <Package className="h-5 w-5" /> },
        { label: "Analytics", href: "/analytics", icon: <BarChart2 className="h-5 w-5" /> },
        { label: "Settings", href: "/settings", icon: <Settings className="h-5 w-5" /> },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <div className="md:hidden fixed top-4 left-4 z-50">
                <button onClick={() => setOpen(!open)} className="p-2 bg-white rounded-md shadow-md">
                    {open ? <X /> : <Menu />}
                </button>
            </div>

            {/* Sidebar Container */}
            <div className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-xl border-r border-gray-200 transition-transform duration-300 md:translate-x-0 dark:bg-black/90 dark:border-gray-800",
                open ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                            L2C System
                        </span>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 overflow-y-auto py-4">
                        <ul className="space-y-1 px-3">
                            {links.map((link) => {
                                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                isActive 
                                                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400" 
                                                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            {link.icon}
                                            {link.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Admin User</span>
                                <span className="text-xs text-gray-500">View Profile</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
