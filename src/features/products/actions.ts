'use server';

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
    activateProduct
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
    removeProductSupplier
} = manageSuppliers;
