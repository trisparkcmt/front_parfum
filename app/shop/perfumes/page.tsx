import { Metadata } from 'next';
import PerfumesShopClient from './PerfumesShopClient';

export const metadata: Metadata = {
  title: 'Parfums de marque, dupes et creations sur mesure',
  description: 'Découvrez des parfums de marque, des dupes de parfum et des creations olfactives sur mesure sur Accessoires Exclusifs.',
  alternates: {
    canonical: 'https://accessoires-exclusifs.vercel.app/shop/perfumes',
  },
  openGraph: {
    title: 'Parfums de marque, dupes et creations sur mesure',
    description: 'Parfums de marque, dupes de parfum et creations olfactives sur mesure avec atelier exclusif.',
    url: 'https://accessoires-exclusifs.vercel.app/shop/perfumes',
    type: 'website',
  },
};

export default function PerfumesShop() {
  return <PerfumesShopClient />;
}
