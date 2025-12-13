import { faker } from '@faker-js/faker';
import type { Lead } from '@/types';

export const createLead = (overrides?: Partial<Lead>): Lead => {
  const baseLead: Lead = {
    id: faker.string.uuid(),
    customer_id: faker.string.uuid(),
    customer_name: faker.person.fullName(),
    customer_phone: faker.phone.number(),
    customer_email: faker.internet.email(),
    project_name: faker.company.name() + ' 项目',
    project_address: faker.location.streetAddress() + ', ' + faker.location.city(),
    project_area: faker.number.float({ min: 50, max: 500, precision: 0.1 }),
    lead_source: faker.helpers.arrayElement(['online', 'referral', 'call', 'email', 'other']),
    lead_status: faker.helpers.arrayElement(['new', 'assigned', 'quoted', 'converted', 'lost']),
    assigned_to: faker.string.uuid(),
    assigned_at: faker.date.recent().toISOString(),
    created_by: faker.string.uuid(),
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
    notes: faker.lorem.paragraph(),
    tags: [faker.lorem.word(), faker.lorem.word()],
    expected_budget: faker.number.float({ min: 10000, max: 1000000, precision: 100 }),
    follow_up_date: faker.date.future().toISOString(),
  };

  return { ...baseLead, ...overrides };
};

export const createLeads = (count: number, overrides?: Partial<Lead>): Lead[] => {
  return Array.from({ length: count }, () => createLead(overrides));
};

export const createLeadWithQuotes = (overrides?: Partial<Lead> & { quoteCount?: number }) => {
  const { quoteCount = 1, ...leadOverrides } = overrides || {};
  const lead = createLead(leadOverrides);
  
  return {
    ...lead,
    quotes: Array.from({ length: quoteCount }, () => ({
      id: faker.string.uuid(),
      lead_id: lead.id,
      quote_number: faker.string.alphanumeric(10).toUpperCase(),
      quote_date: faker.date.recent().toISOString(),
      quote_amount: faker.number.float({ min: 5000, max: 500000, precision: 100 }),
      quote_status: faker.helpers.arrayElement(['draft', 'sent', 'accepted', 'rejected']),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    }))
  };
};

export const createLeadWithOrder = (overrides?: Partial<Lead>) => {
  const lead = createLead(overrides);
  
  return {
    ...lead,
    lead_status: 'converted',
    order: {
      id: faker.string.uuid(),
      lead_id: lead.id,
      order_number: faker.string.alphanumeric(12).toUpperCase(),
      order_date: faker.date.recent().toISOString(),
      order_amount: faker.number.float({ min: 5000, max: 500000, precision: 100 }),
      order_status: faker.helpers.arrayElement(['pending', 'processing', 'completed', 'cancelled']),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    }
  };
};