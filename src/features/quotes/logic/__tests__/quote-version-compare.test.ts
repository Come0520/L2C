import { compareItems, ItemDiff } from '../compare-utils';
import { ExtendedItem } from '../../types';

describe('Quote Version Compare Logic', () => {
    // Base item template
    const baseItem: ExtendedItem = {
        id: 'item-1',
        name: 'Fabric A',
        quantity: 1,
        unitPrice: 100,
        amount: 100,
        roomName: 'Living Room',
        specs: {
            fabricDirection: 'HEIGHT',
            fabricSize: 280,
        }
    };

    it('should detect no changes for identical items', () => {
        const diff = compareItems(baseItem, { ...baseItem });
        expect(diff.type).toBe('UNCHANGED');
        expect(Object.keys(diff.changes)).toHaveLength(0);
    });

    it('should detect changes in basic fields (quantity, price)', () => {
        const newItem = {
            ...baseItem,
            quantity: 2,
            amount: 200
        };
        const diff = compareItems(baseItem, newItem);

        expect(diff.type).toBe('MODIFIED');
        expect(diff.changes).toHaveProperty('quantity');
        expect(diff.changes.quantity.oldValue).toBe(1);
        expect(diff.changes.quantity.newValue).toBe(2);
        expect(diff.changes).toHaveProperty('amount');
    });

    it('should detect changes in specs (fabricDirection)', () => {
        const newItem: ExtendedItem = {
            ...baseItem,
            specs: {
                ...baseItem.specs,
                fabricDirection: 'WIDTH'
            }
        };
        const diff = compareItems(baseItem, newItem);

        expect(diff.type).toBe('MODIFIED');
        expect(diff.changes).toHaveProperty('specs.fabricDirection');
        expect(diff.changes['specs.fabricDirection'].oldValue).toBe('HEIGHT');
        expect(diff.changes['specs.fabricDirection'].newValue).toBe('WIDTH');
    });

    it('should handle missing specs gracefully', () => {
        const itemWithoutSpecs: ExtendedItem = { ...baseItem, specs: undefined };
        const itemWithSpecs: ExtendedItem = { ...baseItem }; // has specs

        // Should detect changes in specs fields implicitly (undefined vs value)
        const diff = compareItems(itemWithoutSpecs, itemWithSpecs);

        // compareItems logic iterates over known spec fields.
        // fabricDirection: undefined vs 'HEIGHT'
        expect(diff.type).toBe('MODIFIED');
        expect(diff.changes).toHaveProperty('specs.fabricDirection');
    });

    it('should treat null and undefined as equal for optional fields', () => {
        const itemNull: ExtendedItem = { ...baseItem, remark: null as any }; // simulating null from DB
        const itemUndefined: ExtendedItem = { ...baseItem, remark: undefined };

        const diff = compareItems(itemNull, itemUndefined);
        expect(diff.type).toBe('UNCHANGED');
        expect(diff.changes).not.toHaveProperty('remark');
    });
});
