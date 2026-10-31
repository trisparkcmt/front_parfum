import type { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'Conditions générales',
  description:
    "Consultez les conditions générales d'utilisation et de vente d'Accessoires Exclusifs.",
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return <TermsClient />;
}
