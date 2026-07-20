import type { Metadata } from 'next';
import StorePage from './StorePage.client';

export const metadata: Metadata = {
  title: 'Notre Boutique | Trouvez-nous à Yaoundé',
  description: 'Retrouvez la boutique Accessoires Exclusifs à Yaoundé, Cameroun. Horaires, adresse et itinéraire.',
};

export default function NoutreBoutiquePage() {
  return <StorePage />;
}
