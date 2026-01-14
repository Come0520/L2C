"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemesProviderProps } from "next-themes";

// Define strict types for NextThemesProvider props since we are re-exporting
export function ThemeProvider({ children, ...props }: NextThemesProviderProps) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
