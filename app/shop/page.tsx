import { Metadata } from 'next';
import ShopRedirectClient from './ShopRedirectClient';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Discover premium perfumes, dupes and luxury accessories on Accessoires Exclusifs.',
  alternates: {
    canonical: 'https://accessoiresexclusifs.com/shop',
  },
};

export default function ShopPage() {
  return <ShopRedirectClient />;
}
