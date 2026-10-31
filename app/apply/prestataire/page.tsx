import type { Metadata } from 'next';
import ApplyPrestataireClient from './ApplyPrestataireClient';

export const metadata: Metadata = {
  title: 'Devenir prestataire partenaire',
  description:
    'Rejoignez Accessoires Exclusifs comme prestataire partenaire et développez vos ventes.',
  alternates: {
    canonical: '/apply/prestataire',
  },
};

export default function ApplyPrestatairePage() {
  return <ApplyPrestataireClient />;
}
