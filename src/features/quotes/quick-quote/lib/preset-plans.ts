export type PlanType = 'ECONOMIC' | 'COMFORT' | 'LUXURY';

export interface ProductConfig {
    name: string;
    description: string;
    unitPrice: number;
    category: string;
    width?: number;
    foldRatio?: number;
}

export interface PlanConfig {
    id: PlanType;
    name: string;
    description: string;
    fabric: ProductConfig;
    sheer?: ProductConfig;
    track: ProductConfig;
    valance?: ProductConfig;
}

export const PRESET_PLANS: Record<PlanType, PlanConfig> = {
    ECONOMIC: {
        id: 'ECONOMIC',
        name: 'Economic',
        description: 'Basic plan',
        fabric: { name: 'Basic Fabric', description: 'Simple fabric', unitPrice: 45, category: 'CURTAIN_FABRIC' },
        track: { name: 'Basic Track', description: 'Simple track', unitPrice: 25, category: 'CURTAIN_TRACK' }
    },
    COMFORT: {
        id: 'COMFORT',
        name: 'Comfort',
        description: 'Balanced plan',
        fabric: { name: 'Comfort Fabric', description: 'Better fabric', unitPrice: 85, category: 'CURTAIN_FABRIC' },
        track: { name: 'Comfort Track', description: 'Better track', unitPrice: 45, category: 'CURTAIN_TRACK' }
    },
    LUXURY: {
        id: 'LUXURY',
        name: 'Luxury',
        description: 'High-end plan',
        fabric: { name: 'Luxury Fabric', description: 'Premium fabric', unitPrice: 168, category: 'CURTAIN_FABRIC' },
        track: { name: 'Smart Track', description: 'Motorized track', unitPrice: 480, category: 'MOTOR' }
    }
};
