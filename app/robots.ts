import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://accessoiresexclusifs.com/sitemap.xml',
    host: 'https://accessoiresexclusifs.com',
  };
}
