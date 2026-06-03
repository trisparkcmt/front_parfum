import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Numba Atelier',
    short_name: 'Numba',
    description: 'An exclusive fragrance creation experience.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/logo3.jpg',
        sizes: 'any',
        type: 'image/jpeg',
      },
    ],
  }
}