import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;
 
  // Ensure that a valid locale is used
  if (!locale || !['zh-CN'].includes(locale)) {
    locale = 'zh-CN';
  }
 
  return {
    locale,
    messages: (await import(`../locales/${locale}.json`)).default
  };
});
