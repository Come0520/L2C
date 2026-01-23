"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type VisualStyle = "glass" | "clay" | "cute" | "parchment";

interface StyleContextType {
    style: VisualStyle;
    setStyle: (style: VisualStyle) => void;
}

const StyleContext = createContext<StyleContextType | undefined>(undefined);

export default function StyleProvider({ children }: { children: React.ReactNode }) {
    const [style, setStyle] = useState<VisualStyle>("glass");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // Load persisted style from localStorage
        const savedStyle = localStorage.getItem("l2c-ui-style") as VisualStyle;
        if (savedStyle && ["glass", "clay", "cute", "parchment"].includes(savedStyle)) {
            setStyle(savedStyle);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            // Apply data-style attribute to document element
            document.documentElement.setAttribute("data-style", style);
            // Persist to localStorage
            localStorage.setItem("l2c-ui-style", style);
        }
    }, [style, mounted]);

    // Prevent flash of incorrect style by returning early or applying default immediately?
    // Since we rely on document attribute, we can render children but the effect runs client-side.
    // To avoid hydration mismatch, we don't block rendering, but style might jump.
    // Ideally this would be handled by a script in head, but for now client-side effect is acceptable.

    return (
        <StyleContext.Provider value={{ style, setStyle }}>
            {children}
        </StyleContext.Provider>
    );
}

export function useStyle() {
    const context = useContext(StyleContext);
    if (context === undefined) {
        throw new Error("useStyle must be used within a StyleProvider");
    }
    return context;
}
