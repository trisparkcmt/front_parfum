import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://accessoires-exclusifs.vercel.app/sitemap.xml',
    host: 'https://accessoires-exclusifs.vercel.app',
  };
}
