import type { Metadata } from 'next';
import ApplyBoutiqueClient from './ApplyBoutiqueClient';

export const metadata: Metadata = {
  title: 'Devenir boutique partenaire',
  description:
    'Proposez votre boutique pour rejoindre le réseau de partenaires Accessoires Exclusifs.',
  alternates: {
    canonical: '/apply/boutique',
  },
};

export default function ApplyBoutiquePage() {
  return <ApplyBoutiqueClient />;
}
