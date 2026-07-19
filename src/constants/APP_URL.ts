/** Base web URL for the Z app — used for sharing, deep links and external actions. */
export const APP_BASE_URL = 'https://zdotcom.vercel.app';

/** Returns the public web URL for a short (zap) by its ID. */
export const getZapShareUrl = (zapId: string) =>
  `${APP_BASE_URL}/shorts/${zapId}`;
