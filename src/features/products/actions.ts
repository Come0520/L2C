'use server';

import { logger } from "@/shared/lib/logger";

/**
 * 产品模块 Server Actions (Barrel File)
 */

import * as queries from './actions/queries';
import * as mutations from './actions/mutations';
import * as templates from './actions/templates';

// Re-export queries
export const {
    getProducts,
    getProductById
} = queries;

// Re-export mutations
export const {
    createProduct,
    updateProduct,
    deleteProduct,
    activateProduct,
    batchCreateProducts
} = mutations;

// Re-export template actions
export const {
    upsertAttributeTemplate,
    getAttributeTemplate
} = templates;

import * as manageSuppliers from './actions/manage-suppliers';
export const {
    getProductSuppliers,
    addProductSupplier,
    updateProductSupplier,
    removeProductSupplier,
    // [Product-03] 供应商关联增强
    compareSupplierPrices,
    autoSwitchDefaultSupplier
} = manageSuppliers;

// 套餐管理
import * as packageActions from './actions/package-actions';
export const {
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
} = packageActions;

// 组合商品管理
import * as bundleActions from './actions/bundle-actions';
export const {
    getBundles,
    getBundleById,
    createBundle,
    updateBundle,
    deleteBundle,
    updateBundleItems,
    calculateBundleCost
} = bundleActions;

// 渠道专属价管理
import * as channelPriceActions from './actions/channel-price-actions';
export const {
    getChannelPrices,
    getAllChannelPrices,
    addChannelPrice,
    updateChannelPrice,
    removeChannelPrice,
    getProductPriceForChannel
} = channelPriceActions;

// 渠道等级折扣管理
import * as channelDiscountActions from './actions/channel-discount-actions';
export const {
    getGlobalDiscountConfig,
    updateGlobalDiscountConfig,
    getDiscountOverrides,
    createDiscountOverride,
    updateDiscountOverride,
    deleteDiscountOverride,
    getProductDiscountRate
} = channelDiscountActions;

