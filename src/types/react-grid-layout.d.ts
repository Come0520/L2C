declare module 'react-grid-layout' {
    import * as React from 'react';

    export interface Layout {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
        minW?: number;
        minH?: number;
        maxW?: number;
        maxH?: number;
        static?: boolean;
        isDraggable?: boolean;
        isResizable?: boolean;
    }

    export interface Layouts {
        [P: string]: Layout[];
    }

    export interface ResponsiveProps {
        className?: string;
        style?: React.CSSProperties;
        width?: number;
        autoSize?: boolean;
        cols?: { [P: string]: number };
        draggableCancel?: string;
        draggableHandle?: string;
        verticalCompact?: boolean;
        compactType?: 'horizontal' | 'vertical' | null;
        layout?: Layout[];
        layouts?: Layouts;
        margin?: [number, number];
        containerPadding?: [number, number] | { [P: string]: [number, number] };
        rowHeight?: number;
        maxRows?: number;
        isDraggable?: boolean;
        isResizable?: boolean;
        isBounded?: boolean;
        useCSSTransforms?: boolean;
        transformScale?: number;
        preventCollision?: boolean;
        isDroppable?: boolean;
        resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
        breakpoints?: { [P: string]: number };
        onLayoutChange?: (currentLayout: Layout[], allLayouts: Layouts) => void;
        onBreakpointChange?: (newBreakpoint: string, newCols: number) => void;
        onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
        children?: React.ReactNode;
    }

    export class Responsive extends React.Component<ResponsiveProps> { }

    export function WidthProvider<P extends object>(
        ComposedComponent: React.ComponentType<P>
    ): React.ComponentType<Omit<P, 'width'>>;

    const ReactGridLayout: React.ComponentType<ResponsiveProps>;
    export default ReactGridLayout;
}

declare module 'react-grid-layout/css/styles.css';
declare module 'react-resizable/css/styles.css';
