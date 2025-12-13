import { faker } from '@faker-js/faker';
import type { Order, OrderItem } from '@/types';

export const createOrderItem = (overrides?: Partial<OrderItem>): OrderItem => {
  const baseItem: OrderItem = {
    id: faker.string.uuid(),
    order_id: faker.string.uuid(),
    product_id: faker.string.uuid(),
    product_name: faker.commerce.productName(),
    quantity: faker.number.int({ min: 1, max: 100 }),
    unit_price: faker.number.float({ min: 100, max: 10000, precision: 10 }),
    total_price: faker.number.float({ min: 100, max: 100000, precision: 100 }),
    notes: faker.lorem.sentence(),
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  };

  return { ...baseItem, ...overrides };
};

export const createOrder = (overrides?: Partial<Order>): Order => {
  const baseOrder: Order = {
    id: faker.string.uuid(),
    lead_id: faker.string.uuid(),
    order_number: faker.string.alphanumeric(12).toUpperCase(),
    order_date: faker.date.recent().toISOString(),
    order_status: faker.helpers.arrayElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'completed']),
    customer_id: faker.string.uuid(),
    customer_name: faker.person.fullName(),
    customer_phone: faker.phone.number(),
    customer_email: faker.internet.email(),
    shipping_address: faker.location.streetAddress() + ', ' + faker.location.city(),
    billing_address: faker.location.streetAddress() + ', ' + faker.location.city(),
    contact_person: faker.person.fullName(),
    contact_phone: faker.phone.number(),
    total_amount: faker.number.float({ min: 5000, max: 1000000, precision: 100 }),
    discount_amount: faker.number.float({ min: 0, max: 100000, precision: 100 }),
    tax_amount: faker.number.float({ min: 0, max: 50000, precision: 100 }),
    final_amount: faker.number.float({ min: 5000, max: 1000000, precision: 100 }),
    payment_status: faker.helpers.arrayElement(['unpaid', 'partially_paid', 'paid', 'overpaid', 'refunded']),
    payment_method: faker.helpers.arrayElement(['bank_transfer', 'credit_card', 'cash', 'check', 'other']),
    assigned_to: faker.string.uuid(),
    created_by: faker.string.uuid(),
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    notes: faker.lorem.paragraph(),
    tags: [faker.lorem.word(), faker.lorem.word()],
    expected_delivery_date: faker.date.future().toISOString(),
    actual_delivery_date: null,
  };

  return { ...baseOrder, ...overrides };
};

export const createOrders = (count: number, overrides?: Partial<Order>): Order[] => {
  return Array.from({ length: count }, () => createOrder(overrides));
};

export const createOrderWithItems = (overrides?: Partial<Order> & { itemCount?: number }) => {
  const { itemCount = 3, ...orderOverrides } = overrides || {};
  const order = createOrder(orderOverrides);
  
  const items = Array.from({ length: itemCount }, () => 
    createOrderItem({ order_id: order.id })
  );

  const totalItemsAmount = items.reduce((sum, item) => sum + item.total_price, 0);
  
  return {
    ...order,
    total_amount: totalItemsAmount,
    final_amount: totalItemsAmount - (order.discount_amount || 0) + (order.tax_amount || 0),
    items,
  };
};

export const createOrderWithMeasurement = (overrides?: Partial<Order>) => {
  const order = createOrder(overrides);
  
  return {
    ...order,
    order_status: 'processing',
    measurement: {
      id: faker.string.uuid(),
      order_id: order.id,
      measurement_date: faker.date.future().toISOString(),
      measured_by: faker.string.uuid(),
      measurement_status: faker.helpers.arrayElement(['scheduled', 'completed', 'rejected', 'pending']),
      measurements: {
        length: faker.number.float({ min: 10, max: 100, precision: 0.1 }),
        width: faker.number.float({ min: 10, max: 100, precision: 0.1 }),
        height: faker.number.float({ min: 2, max: 10, precision: 0.1 }),
        area: faker.number.float({ min: 100, max: 10000, precision: 1 }),
      },
      notes: faker.lorem.paragraph(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    }
  };
};

export const createOrderWithInstallation = (overrides?: Partial<Order>) => {
  const order = createOrder(overrides);
  
  return {
    ...order,
    order_status: 'delivered',
    installation: {
      id: faker.string.uuid(),
      order_id: order.id,
      installation_date: faker.date.future().toISOString(),
      installation_team_id: faker.string.uuid(),
      installation_status: faker.helpers.arrayElement(['scheduled', 'in_progress', 'completed', 'rejected', 'pending']),
      installed_by: [faker.string.uuid(), faker.string.uuid()],
      start_time: faker.date.future().toISOString(),
      end_time: faker.date.future().toISOString(),
      notes: faker.lorem.paragraph(),
      created_at: faker.date.recent().toISOString(),
      updated_at: faker.date.recent().toISOString(),
    }
  };
};