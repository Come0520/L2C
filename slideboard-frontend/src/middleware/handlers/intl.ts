import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

export const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['zh-CN'],
 
  // Used when no locale matches
  defaultLocale: 'zh-CN',

  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  localePrefix: 'always' // For now, let's stick to always or as-needed. 'always' forces /zh-CN/
  // But to avoid breaking existing links immediately, maybe 'as-needed' is better?
  // However, 'as-needed' means default locale is hidden.
  // If we want to move to /zh-CN/... we should probably use 'always' or default.
  // Let's use 'as-needed' to keep root working for zh-CN if possible? 
  // No, 'as-needed' hides the prefix for default locale.
});
