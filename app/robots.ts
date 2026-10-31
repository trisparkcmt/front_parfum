import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/dashboard/',
        '/admin/',
        '/cart',
        '/cart/',
        '/checkout',
        '/checkout/',
        '/profile/',
        '/account/',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/resend-verification',
        '/api',
        '/api/',
      ],
    },
    sitemap: 'https://accessoiresexclusifs.com/sitemap.xml',
    host: 'https://accessoiresexclusifs.com',
  };
}
