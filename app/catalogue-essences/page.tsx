import type { Metadata } from 'next';
import CatalogueEssencesClient from './CatalogueEssencesClient';

export const metadata: Metadata = {
  title: 'Catalogue des Huiles | Accessoires Exclusifs',
  description: 'Catalogue des huiles de parfum, de leurs formats disponibles et de leurs caractéristiques.',
};

export default function CatalogueHuilesPage() {
  return <CatalogueEssencesClient />;
}
