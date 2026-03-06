import { DefaultSession } from 'next-auth';

/**
 * 特殊标记常量，表示未绑定租户的用户
 */
export const UNBOUND_TENANT_ID = '__UNBOUND__';
export const UNBOUND_ROLE = '__UNBOUND__';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      tenantId: string; // UNBOUND_TENANT_ID = 未绑定
      role: string; // @deprecated: Use roles instead
      roles: string[]; // Multi-role support
      isPlatformAdmin: boolean;
      preferences?: {
        avatarBgColor?: string;
        avatarText?: string;
        quoteMode?: 'PRODUCT_FIRST' | 'SPACE_FIRST';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      };
    } & DefaultSession['user'];
  }

  interface User {
    tenantId: string;
    role: string;
    roles: string[];
    isPlatformAdmin: boolean;
    preferences?: {
      avatarBgColor?: string;
      avatarText?: string;
      quoteMode?: 'PRODUCT_FIRST' | 'SPACE_FIRST';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [key: string]: any;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    tenantId: string;
    role: string;
    roles: string[];
    isPlatformAdmin: boolean;
  }
}
