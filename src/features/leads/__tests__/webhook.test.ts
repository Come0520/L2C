import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleWebhookRequest, verifyAccessToken, matchChannel } from '@/features/leads/logic/webhook-handler';
import { db } from '@/shared/api/db';
import { LeadService } from '@/services/lead.service';

// Mock DB and Service
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            tenants: {
                findFirst: vi.fn(),
            },
            leads: {
                findFirst: vi.fn(),
            },
            channels: {
                findFirst: vi.fn(),
            }
        },
    }
}));

vi.mock('@/services/lead.service', () => ({
    LeadService: {
        createLead: vi.fn(),
    }
}));

describe('Webhook Handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('verifyAccessToken', () => {
        it('should return false if token is missing', async () => {
            const result = await verifyAccessToken(null, 'tenant-1');
            expect(result).toBe(false);
        });

        it('should return true if token matches tenant settings', async () => {
            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                settings: { webhookAccessToken: 'valid-token' }
            });

            const result = await verifyAccessToken('valid-token', 'tenant-1');
            expect(result).toBe(true);
        });

        it('should return false if token mismatch', async () => {
            vi.mocked(db.query.tenants.findFirst).mockResolvedValue({
                settings: { webhookAccessToken: 'valid-token' }
            });

            const result = await verifyAccessToken('invalid-token', 'tenant-1');
            expect(result).toBe(false);
        });
    });

    describe('matchChannel', () => {
        it('should return empty if no category name', async () => {
            const result = await matchChannel(undefined, undefined, 'tenant-1');
            expect(result).toEqual({});
        });

        it('should match precise channel name', async () => {
            vi.mocked(db.query.channels.findFirst).mockResolvedValueOnce({ id: 'channel-1' } as never);

            const result = await matchChannel('抖音', '直播间', 'tenant-1');
            expect(result.channelId).toBe('channel-1');
        });
    });

    describe('handleWebhookRequest', () => {
        const mockPayload = {
            customer_name: 'Test Customer',
            customer_phone: '13800000000',
            source_category: '抖音',
            external_id: 'ext-123'
        };

        it('should return 400 if missing required fields', async () => {
            const result = await handleWebhookRequest({} as never, 'tenant-1', 'user-1');
            expect(result.code).toBe(400);
        });

        it('should return 200 (idempotent) if external_id exists', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue({
                id: 'lead-1',
                leadNo: 'LD001',
                status: 'PENDING_ASSIGNMENT'
            });

            const result = await handleWebhookRequest(mockPayload, 'tenant-1', 'user-1');
            expect(result.code).toBe(200);
            expect(result.data?.is_new).toBe(false);
            expect(result.data?.lead_id).toBe('lead-1');
        });

        it('should create lead if new', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue(undefined as never); // No idempotent match
            vi.mocked(LeadService.createLead).mockResolvedValue({
                success: true,
                isDuplicate: false,
                lead: {
                    id: 'new-lead-1',
                    leadNo: 'LD002',
                    status: 'PENDING_ASSIGNMENT'
                }
            });

            const result = await handleWebhookRequest(mockPayload, 'tenant-1', 'user-1');
            expect(result.code).toBe(200);
            expect(result.data?.is_new).toBe(true);
            expect(result.data?.lead_id).toBe('new-lead-1');
            expect(LeadService.createLead).toHaveBeenCalledWith(
                expect.objectContaining({
                    customerName: 'Test Customer',
                    externalId: 'ext-123'
                }),
                'tenant-1',
                'user-1'
            );
        });

        it('should return 409 if duplicate phone/address detected', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue(undefined as never);
            vi.mocked(LeadService.createLead).mockResolvedValue({
                isDuplicate: true,
                lead: { id: 'existing', leadNo: 'LD-EXIST' }
            });

            const result = await handleWebhookRequest(mockPayload, 'tenant-1', 'user-1');
            expect(result.code).toBe(409);
        });
    });
});
