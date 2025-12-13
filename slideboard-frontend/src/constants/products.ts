import { PackageItemType } from '@/shared/types/order'

// 产品定义接口
export interface ProductDefinition {
    id: string
    name: string
    imageUrl: string
    type: PackageItemType | 'accessory'
    unit: string
    price: number
    packageTag?: string // 是否属于某套餐
}

// 一级分类选项
export const CATEGORY_LEVEL1_OPTIONS = [
    { value: '窗帘', label: '窗帘' },
    { value: '墙布', label: '墙布' },
    { value: '墙咔', label: '墙咔' },
    { value: '飘窗垫', label: '飘窗垫' },
    { value: '标品', label: '标品' },
    { value: '礼品', label: '礼品' },
    { value: '销售道具', label: '销售道具' }
];

// 二级分类选项映射
export const CATEGORY_LEVEL2_MAPPING: Record<string, Array<{ value: string; label: string }>> = {
    '窗帘': [
        { value: '布', label: '布' },
        { value: '纱', label: '纱' },
        { value: '轨道', label: '轨道' },
        { value: '电机', label: '电机' },
        { value: '功能帘', label: '功能帘' },
        { value: '绑带', label: '绑带' }
    ],
    '墙布': [
        { value: '艺术漆', label: '艺术漆' },
        { value: '提花', label: '提花' },
        { value: '印花', label: '印花' }
    ],
    '墙咔': [
        { value: '大板', label: '大板' },
        { value: '小板', label: '小板' },
        { value: '灯带', label: '灯带' },
        { value: '金属条', label: '金属条' }
    ],
    '飘窗垫': [
        { value: '有底板', label: '有底板' },
        { value: '没底板', label: '没底板' }
    ],
    '标品': [
        { value: '毛浴巾', label: '毛浴巾' },
        { value: '四件套', label: '四件套' },
        { value: '被芯', label: '被芯' },
        { value: '枕芯', label: '枕芯' }
    ],
    '礼品': [
        { value: '办公用品', label: '办公用品' },
        { value: '家居用品', label: '家居用品' },
        { value: '定制礼品', label: '定制礼品' },
        { value: '促销礼品', label: '促销礼品' }
    ],
    '销售道具': [
        { value: '展示器材', label: '展示器材' },
        { value: '宣传物料', label: '宣传物料' },
        { value: '样品', label: '样品' },
        { value: '工具包', label: '工具包' }
    ]
};

// 产品状态选项
export const PRODUCT_STATUS_OPTIONS = [
    { value: 'all', label: '全部状态' },
    { value: 'draft', label: '草稿' },
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
    { value: 'online', label: '已上架' },
    { value: 'offline', label: '已下架' }
];

// 门店选项
export const STORE_OPTIONS = [
    { value: '一店', label: '一店' },
    { value: '二店', label: '二店' },
    { value: '三店', label: '三店' },
    { value: '线上店', label: '线上店' }
];

// 计算方式选项
export const CALCULATION_TYPE_OPTIONS = [
    { value: '定高', label: '定高' },
    { value: '定宽', label: '定宽' }
];

// 产品图片类型选项
export const PRODUCT_IMAGE_TYPES = [
    { key: 'detailImages', label: '产品细节图' },
    { key: 'effectImages', label: '效果展示图' },
    { key: 'caseImages', label: '案例效果图' }
] as const;

// 产品标签选项
export const PRODUCT_TAG_OPTIONS = {
    styleTags: ['现代简约', '轻奢', '新中式', '北欧', '美式', '欧式'],
    packageTags: ['套餐内', '套餐外', '单品'],
    activityTags: ['热销款', '促销款', '新品', '推荐款'],
    seasonTags: ['春', '夏', '秋', '冬', '四季通用'],
    demographicTags: ['儿童', '老人', '年轻人', '情侣', '家庭']
};

// 模拟产品数据
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
