import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Accessoires Exclusive',
    short_name: 'Accessoires Exclusive',
    description: 'Luxe & Création de Parfums — Boutique, Atelier IA et Livraison',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#050505',
    theme_color: '#C5A059',
    lang: 'fr',
    categories: ['shopping', 'lifestyle', 'beauty'],
    icons: [
      {
        src: '/icons/icon-192x192.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.jpeg',
        sizes: '192x192',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.jpeg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'maskable',
      },
    ],
  }
}