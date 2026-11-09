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
        '/index.php',
        '/index.php/',
        '/*index.php*',
        '/*?*add-to-cart=*',
        '/*add-to-cart=*',
        '/*?*opts=*',
        '/*?*stock_status=*',
        '/*?*shop_view=*',
        '/*?*per_row=*',
        '/*?*per_page=*',
        '/*?*product=*',
      ],
    },
    sitemap: 'https://accessoiresexclusifs.com/sitemap.xml',
    host: 'https://accessoiresexclusifs.com',
  };
}
