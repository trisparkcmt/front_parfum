import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://accessoires-exclusifs.vercel.app';

  // If you fetch dynamic data (like products, posts, or items), fetch them here:
  // const items = await getYourItems();
  // const dynamicUrls = items.map(item => ({ url: `${baseUrl}/item/${item.id}`, lastModified: new Date() }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // ...dynamicUrls (spread your dynamic URLs here if you have any)
  ];
}