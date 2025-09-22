export function detectPlatform(userAgent = '') {
  const ua = userAgent.toLowerCase();

  if (/(iphone|ipad|ipod)/i.test(ua)) return 'IOS';
  if (/android/i.test(ua)) return 'ANDROID';

  // navegadores de desktop
  if (/windows|macintosh|linux/i.test(ua)) return 'DESKTOP';

  return 'UNKNOWN';
}
