import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://appstack.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/marketplace', '/marketplace/', '/about'],
        disallow: ['/buyer', '/seller', '/admin'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
