import { Metadata } from 'next';
import NumbaLandingClient from './NumbaLandingClient';

export const metadata: Metadata = {
  title: 'Création parfum sur mesure et atelier olfactif',
  description: 'Créez votre parfum sur mesure avec notre atelier olfactif, un accompagnement personnalisé et des compositions uniques.',
  alternates: {
    canonical: 'https://accessoiresexclusifs.com/numba',
  },
  openGraph: {
    title: 'Création parfum sur mesure et atelier olfactif',
    description: 'Atelier de création parfum sur mesure avec accompagnement personnalisé et compositions uniques.',
    url: 'https://accessoiresexclusifs.com/numba',
    type: 'website',
  },
};

export default function NumbaLanding() {
  return <NumbaLandingClient />;
}
