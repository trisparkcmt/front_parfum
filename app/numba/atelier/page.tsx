import type { Metadata } from 'next';
import AtelierPage from './AtelierClient';

export const metadata: Metadata = {
  title: 'Atelier de création de parfum sur-mesure | Numba',
  description:
    'Créez votre parfum unique sur-mesure dans notre atelier olfactif interactif Numba. Choisissez vos notes de tête, de cœur et de fond.',
  alternates: {
    canonical: 'https://accessoiresexclusifs.com/numba/atelier',
  },
  openGraph: {
    title: 'Atelier de création de parfum sur-mesure | Numba',
    description:
      'Créez votre parfum unique sur-mesure dans notre atelier olfactif interactif Numba.',
    url: 'https://accessoiresexclusifs.com/numba/atelier',
    type: 'website',
  },
};

export default function Page() {
  return (
    <>
      <section className="sr-only">
        <h1>Atelier de création de parfum sur-mesure</h1>
        <p>
          Atelier interactif de personnalisation olfactive par Accessoires Exclusifs et Numba.
        </p>
      </section>
      <AtelierPage />
    </>
  );
}
