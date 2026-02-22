/**
 * 报价版本比较工具
 * 用于比较报价项目的变更
 */

export interface FieldChange {
    oldValue?: unknown;
    newValue?: unknown;
}

export interface ItemDiff {
    type: 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';
    changes: Record<string, FieldChange>;
}

export interface ExtendedItem {
    id: string;
    name?: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
    roomName?: string;
    unit?: string;
    width?: number;
    height?: number;
    installPosition?: string;
    openingStyle?: string;
    foldRatio?: number;
    groundClearance?: number;
    remark?: string;
    specs?: Record<string, unknown>;
    attachments?: Array<{ id: string; url: string }>;
}

interface QuoteVersion {
    id: string;
    items?: ExtendedItem[];
}

interface Attachment {
    id: string;
    url?: string;
}

function areEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null && b == null) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => areEqual(item, b[index]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
        const objA = a as Record<string, unknown>;
        const objB = b as Record<string, unknown>;
        const keysA = Object.keys(objA);
        const keysB = Object.keys(objB);
        if (keysA.length !== keysB.length) return false;
        return keysA.every(key => areEqual(objA[key], objB[key]));
    }

    return false;
}

function compareSpecs(
    oldSpecs: Record<string, unknown> | undefined,
    newSpecs: Record<string, unknown> | undefined,
    changes: Record<string, FieldChange>
) {
    if (!oldSpecs && !newSpecs) return;

    const oldKeys = Object.keys(oldSpecs || {});
    const newKeys = Object.keys(newSpecs || {});
    const allKeys = new Set([...oldKeys, ...newKeys]);

    for (const key of allKeys) {
        const oldValue = oldSpecs?.[key];
        const newValue = newSpecs?.[key];

        if (!areEqual(oldValue, newValue)) {
            changes[`specs.${key}`] = {
                oldValue: oldValue ?? undefined,
                newValue: newValue ?? undefined,
            };
        }
    }
}

function compareAttachments(
    oldAttachments: Attachment[] | undefined,
    newAttachments: Attachment[] | undefined,
    changes: Record<string, FieldChange>
) {
    if (!oldAttachments && !newAttachments) return;

    const oldIds = (oldAttachments || []).map((a) => a.id).toSorted();
    const newIds = (newAttachments || []).map((a) => a.id).toSorted();

    if (!areEqual(oldIds, newIds)) {
        changes.attachments = {
            oldValue: oldAttachments,
            newValue: newAttachments,
        };
    }
}

export const compareItems = (oldItem: ExtendedItem, newItem: ExtendedItem): ItemDiff => {
    const changes: Record<string, FieldChange> = {};

    const basicFields: (keyof ExtendedItem)[] = [
        'name', 'quantity', 'unitPrice', 'amount', 'roomName',
        'unit', 'width', 'height', 'installPosition', 'openingStyle',
        'foldRatio', 'groundClearance', 'remark'
    ];

    for (const field of basicFields) {
        const oldValue = oldItem[field];
        const newValue = newItem[field];

        if (!areEqual(oldValue, newValue)) {
            changes[field] = {
                oldValue: oldValue ?? undefined,
                newValue: newValue ?? undefined,
            };
        }
    }

    compareSpecs(oldItem.specs, newItem.specs, changes);
    compareAttachments(oldItem.attachments, newItem.attachments, changes);

    const type: DiffType = Object.keys(changes).length === 0 ? 'UNCHANGED' : 'MODIFIED';

    return { type, changes };
};

type DiffType = 'UNCHANGED' | 'MODIFIED' | 'ADDED' | 'REMOVED';

export interface QuoteVersionDiff {
    items: Array<{
        itemId: string;
        name: string;
        diff: ItemDiff;
    }>;
    summary: {
        totalAmount?: FieldChange;
        discount?: FieldChange;
        finalAmount?: FieldChange;
        [key: string]: FieldChange | undefined; // Allow dynamic access
    };
}

export interface ExtendedQuoteVersion extends QuoteVersion {
    totalAmount?: number;
    discount?: number;
    finalAmount?: number;
}

export function compareQuoteVersions(v1: ExtendedQuoteVersion, v2: ExtendedQuoteVersion): QuoteVersionDiff {
    const diff: QuoteVersionDiff = {
        items: [],
        summary: {}
    };

    // 1. Compare Summary Fields
    const summaryFields: (keyof ExtendedQuoteVersion)[] = ['totalAmount', 'discount', 'finalAmount'];
    for (const field of summaryFields) {
        if (!areEqual(v1[field], v2[field])) {
            // P2-R5-02: Removed ts-ignore annotation by adding index signature to QuoteVersionDiff.summary
            diff.summary[field as string] = {
                oldValue: v1[field],
                newValue: v2[field]
            };
        }
    }

    // 2. Compare Items
    const v1Items = new Map(v1.items?.map(i => [i.id, i]) || []);
    const v2Items = new Map(v2.items?.map(i => [i.id, i]) || []);

    const allIds = new Set([...v1Items.keys(), ...v2Items.keys()]);

    for (const id of allIds) {
        const item1 = v1Items.get(id);
        const item2 = v2Items.get(id);

        if (item1 && item2) {
            // Modified or Unchanged
            const itemDiff = compareItems(item1, item2);
            if (itemDiff.type !== 'UNCHANGED') {
                diff.items.push({
                    itemId: id,
                    name: item2.name || item1.name || 'Unknown',
                    diff: itemDiff
                });
            }
        } else if (item1) {
            // Removed
            diff.items.push({
                itemId: id,
                name: item1.name || 'Unknown',
                diff: {
                    type: 'REMOVED',
                    changes: {
                        _self: { oldValue: item1, newValue: undefined }
                    }
                }
            });
        } else if (item2) {
            // Added
            diff.items.push({
                itemId: id,
                name: item2.name || 'Unknown',
                diff: {
                    type: 'ADDED',
                    changes: {
                        _self: { oldValue: undefined, newValue: item2 }
                    }
                }
            });
        }
    }

    return diff;
}