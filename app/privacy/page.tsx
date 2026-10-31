import type { Metadata } from 'next';
import PrivacyClient from './PrivacyClient';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    'Découvrez comment Accessoires Exclusifs collecte, utilise et protège vos données personnelles.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
