import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: 'Accessoires Exclusifs | Luxe & Création de Parfums',
  description:
    "Découvrez des accessoires de luxe, des parfums de marque et notre atelier de création olfactive sur mesure.",
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      <section className="sr-only">
        <h1>Accessoires Exclusifs | Luxe & Création de Parfums</h1>
        <p>
          Découvrez notre sélection d'accessoires, de parfums de marque et de créations
          olfactives sur mesure.
        </p>
      </section>
      <HomeClient />
    </>
  );
}
