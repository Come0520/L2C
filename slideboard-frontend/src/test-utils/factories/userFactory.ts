import { faker } from '@faker-js/faker';
import type { User, Team } from '@/types';

export const createUser = (overrides?: Partial<User>): User => {
  const baseUser: User = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    full_name: faker.person.fullName(),
    phone: faker.phone.number(),
    avatar_url: faker.image.avatar(),
    role: faker.helpers.arrayElement(['admin', 'manager', 'salesperson', 'technician', 'installer', 'accountant', 'customer']),
    status: faker.helpers.arrayElement(['active', 'inactive', 'pending', 'suspended']),
    team_id: faker.string.uuid(),
    department: faker.helpers.arrayElement(['sales', 'technical', 'installation', 'finance', 'admin']),
    position: faker.person.jobTitle(),
    join_date: faker.date.past().toISOString(),
    last_login: faker.date.recent().toISOString(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    settings: {
      notifications: true,
      theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
      language: 'zh-CN',
    },
    permissions: {
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: true,
      can_approve: faker.datatype.boolean(),
      can_assign: faker.datatype.boolean(),
      can_view_reports: faker.datatype.boolean(),
    },
  };

  return { ...baseUser, ...overrides };
};

export const createUsers = (count: number, overrides?: Partial<User>): User[] => {
  return Array.from({ length: count }, () => createUser(overrides));
};

export const createAdminUser = (overrides?: Partial<User>): User => {
  return createUser({
    role: 'admin',
    permissions: {
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: true,
      can_approve: true,
      can_assign: true,
      can_view_reports: true,
    },
    ...overrides,
  });
};

export const createManagerUser = (overrides?: Partial<User>): User => {
  return createUser({
    role: 'manager',
    department: faker.helpers.arrayElement(['sales', 'technical', 'installation']),
    permissions: {
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: true,
      can_approve: true,
      can_assign: true,
      can_view_reports: true,
    },
    ...overrides,
  });
};

export const createSalespersonUser = (overrides?: Partial<User>): User => {
  return createUser({
    role: 'salesperson',
    department: 'sales',
    position: '销售代表',
    permissions: {
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: false,
      can_approve: false,
      can_assign: false,
      can_view_reports: true,
    },
    ...overrides,
  });
};

export const createTechnicianUser = (overrides?: Partial<User>): User => {
  return createUser({
    role: 'technician',
    department: 'technical',
    position: '测量技师',
    permissions: {
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: false,
      can_approve: false,
      can_assign: false,
      can_view_reports: false,
    },
    ...overrides,
  });
};

export const createInstallerUser = (overrides?: Partial<User>): User => {
  return createUser({
    role: 'installer',
    department: 'installation',
    position: '安装师傅',
    permissions: {
      can_create: false,
      can_read: true,
      can_update: true,
      can_delete: false,
      can_approve: false,
      can_assign: false,
      can_view_reports: false,
    },
    ...overrides,
  });
};

export const createAccountantUser = (overrides?: Partial<User>): User => {
  return createUser({
    role: 'accountant',
    department: 'finance',
    position: '会计',
    permissions: {
      can_create: true,
      can_read: true,
      can_update: true,
      can_delete: false,
      can_approve: true,
      can_assign: false,
      can_view_reports: true,
    },
    ...overrides,
  });
};

export const createCustomerUser = (overrides?: Partial<User>): User => {
  return createUser({
    role: 'customer',
    status: 'active',
    permissions: {
      can_create: false,
      can_read: true,
      can_update: true,
      can_delete: false,
      can_approve: false,
      can_assign: false,
      can_view_reports: false,
    },
    ...overrides,
  });
};

export const createUserWithTeam = (overrides?: Partial<User> & { team?: Partial<Team> }) => {
  const { team, ...userOverrides } = overrides || {};
  const user = createUser(userOverrides);
  
  const baseTeam: Team = {
    id: user.team_id,
    name: faker.company.name() + ' 团队',
    description: faker.lorem.paragraph(),
    manager_id: faker.string.uuid(),
    members_count: faker.number.int({ min: 1, max: 50 }),
    status: 'active',
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
  };
  
  return {
    ...user,
    team: { ...baseTeam, ...team },
  };
};

export const createUsersWithRoles = () => {
  return {
    admin: createAdminUser(),
    manager: createManagerUser(),
    salesperson: createSalespersonUser(),
    technician: createTechnicianUser(),
    installer: createInstallerUser(),
    accountant: createAccountantUser(),
    customer: createCustomerUser(),
  };
};