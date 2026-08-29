import { Metadata } from 'next';
import ShopRedirectClient from './ShopRedirectClient';

export const metadata: Metadata = {
  title: 'Boutique',
  description: 'Découvrez les parfums de marque, les dupes et les accessoires de luxe sur Accessoires Exclusifs.',
  alternates: {
    canonical: 'https://accessoiresexclusifs.com/shop',
  },
};

export default function ShopPage() {
  return <ShopRedirectClient />;
}
