import type { Metadata } from 'next';
import CatalogueEssencesClient from './CatalogueEssencesClient';

export const metadata: Metadata = {
  title: 'Catalogue des Essences | Accessoires Exclusifs',
  description: "Catalogue interactif des essences d'exception et de leurs tarifs au millilitre, adapté pour tablette en boutique.",
};

export default function CatalogueEssencesPage() {
  return <CatalogueEssencesClient />;
}
