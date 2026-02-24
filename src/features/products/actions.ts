
/**
 * 产品模块 Server Actions (Barrel File)
 */

export {
    getProducts,
    getProductById
} from './actions/queries';

export {
    createProduct,
    updateProduct,
    deleteProduct,
    activateProduct,
    batchCreateProducts
} from './actions/mutations';

export {
    upsertAttributeTemplate,
    getAttributeTemplate
} from './actions/templates';

export {
    getProductSuppliers,
    addProductSupplier,
    updateProductSupplier,
    removeProductSupplier,
    // [Product-03] 供应商关联增强
    compareSupplierPrices,
    autoSwitchDefaultSupplier
} from './actions/manage-suppliers';

// 套餐管理
export {
    getPackages,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    togglePackageStatus,
    getPackageProducts,
    addPackageProduct,
    removePackageProduct,
    calculatePackagePrice
} from './actions/package-actions';

// 组合商品管理
export {
    getBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    updateBundleItems,
    calculateBundleCost
} from './actions/bundle-actions';

// 渠道专属价管理
export {
    getChannelPrices,
    getAllChannelPrices,
    addChannelPrice,
    updateChannelPrice,
    removeChannelPrice,
    getProductPriceForChannel
} from './actions/channel-price-actions';

// 渠道等级折扣管理
export {
    getGlobalDiscountConfig,
    updateGlobalDiscountConfig,
    getDiscountOverrides,
    createDiscountOverride,
    updateDiscountOverride,
    deleteDiscountOverride,
    getProductDiscountRate
} from './actions/channel-discount-actions';
