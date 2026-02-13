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

export function compareQuoteVersions(_v1: QuoteVersion, _v2: QuoteVersion) {
    return { changes: [] };
}