import { PackageItemType } from '@/shared/types/order'

export interface ProductDefinition {
    id: string
    name: string
    imageUrl: string
    type: PackageItemType | 'accessory'
    unit: string
    price: number
    packageTag?: string // 是否属于某套餐
}

export const MOCK_PRODUCTS: ProductDefinition[] = [
    // 布料
    {
        id: 'p-cloth-001',
        name: '高精密遮光布-米白',
        imageUrl: 'https://images.unsplash.com/photo-1528458909336-e7a0adfed0a5?w=100&q=80',
        type: 'cloth',
        unit: '米',
        price: 68,
        packageTag: '套餐内'
    },
    {
        id: 'p-cloth-002',
        name: '雪尼尔提花布-高级灰',
        imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=100&q=80',
        type: 'cloth',
        unit: '米',
        price: 128,
        packageTag: '套餐内'
    },
    {
        id: 'p-cloth-003',
        name: '进口绒布-复古绿 (升级款)',
        imageUrl: 'https://images.unsplash.com/photo-1507149833265-60c372daea22?w=100&q=80',
        type: 'cloth',
        unit: '米',
        price: 260, // 高于K3套餐基准价180
        packageTag: '套餐内'
    },

    // 纱料
    {
        id: 'p-gauze-001',
        name: '幻影纱-白色',
        imageUrl: 'https://images.unsplash.com/photo-1461887085832-723528669528?w=100&q=80',
        type: 'gauze',
        unit: '米',
        price: 45,
        packageTag: '套餐内'
    },
    {
        id: 'p-gauze-002',
        name: '金刚纱-防勾丝',
        imageUrl: 'https://images.unsplash.com/photo-1534173873400-994364458443?w=100&q=80',
        type: 'gauze',
        unit: '米',
        price: 88,
        packageTag: '套餐内'
    },

    // 轨道
    {
        id: 'p-track-001',
        name: '静音铝合金轨道',
        imageUrl: '',
        type: 'track',
        unit: '米',
        price: 35,
        packageTag: '套餐内'
    },
    {
        id: 'p-track-002',
        name: '电动轨道 (杜亚电机)',
        imageUrl: '',
        type: 'track',
        unit: '米',
        price: 450,
        packageTag: '套餐内'
    }
]
