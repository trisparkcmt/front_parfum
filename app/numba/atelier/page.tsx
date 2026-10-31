import type { Metadata } from 'next';
import { connection } from 'next/server';
import AtelierClient from './AtelierClient';

const TITLE = 'Atelier Numba : créez votre parfum sur mesure';
const DESCRIPTION =
  "Composez votre parfum signature dans l'Atelier Numba : choisissez votre flacon, mélangez des essences d'exception (High, Premium, Super Premium) et visualisez votre création en temps réel.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/numba/atelier',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: 'Accessoires Exclusifs',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Atelier Numba - Création de parfum sur mesure',
      },
    ],
  },
};

export default async function AtelierPage() {
  await connection();

  return (
    <>
      {/* Server-rendered text lets crawlers read the page before the client app loads. */}
      <section className="sr-only">
        <h1>Atelier Numba : créez votre parfum sur mesure</h1>
        <p>
          Composez votre propre parfum : sélectionnez un flacon (30 ml, 50 ml ou 100 ml),
          dosez des essences High, Premium ou Super Premium au millilitre près, choisissez
          la couleur du liquide et commandez votre création personnalisée.
        </p>
      </section>
      <AtelierClient />
    </>
  );
}
