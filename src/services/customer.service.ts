import { db } from "@/shared/api/db";
import { customers, customerAddresses } from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from 'crypto';
import { format } from 'date-fns';

export class CustomerService {

    /**
     * Find a customer by phone number.
     * @param phone 
     */
    static async findByPhone(phone: string) {
        const customer = await db.query.customers.findFirst({
            where: eq(customers.phone, phone),
        });
        return customer || null;
    }

    /**
     * Generates a unique Customer No.
     * Format: C + YYYYMMDD + 4 hex chars
     */
    private static async generateCustomerNo() {
        const prefix = `C${format(new Date(), 'yyyyMMdd')}`;
        const random = randomBytes(2).toString('hex').toUpperCase(); // 4 chars
        return `${prefix}${random}`;
    }

    /**
     * Create a new customer with address handling.
     * @param data 
     * @param tenantId
     * @param userId
     * @param addressData Optional address to create as default
     */
    static async createCustomer(
        data: typeof customers.$inferInsert,
        tenantId: string,
        userId: string,
        addressData?: { address: string }
    ) {
        // 1. Check Phone
        const existing = await db.query.customers.findFirst({
            where: and(
                eq(customers.phone, data.phone),
                eq(customers.tenantId, tenantId)
            )
        });

        if (existing) {
            return { isDuplicate: true, customer: existing };
        }

        // 2. Generate No
        const customerNo = await this.generateCustomerNo();

        // 3. Insert
        const newCustomer = await db.transaction(async (tx) => {
            const [customer] = await tx.insert(customers).values({
                ...data,
                customerNo,
                tenantId,
                createdBy: userId,
            }).returning();

            // 4. Create Default Address if provided
            if (addressData?.address) {
                await tx.insert(customerAddresses).values({
                    tenantId,
                    customerId: customer.id,
                    address: addressData.address,
                    isDefault: true,
                    label: '默认',
                });
            }

            return customer;
        });

        return { isDuplicate: false, customer: newCustomer };
    }
}
