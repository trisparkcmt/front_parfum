import type { Metadata } from 'next';
import AiConsultantClient from './AiConsultantClient';

export const metadata: Metadata = {
  title: 'Conseiller parfum IA',
  description:
    'Trouvez le parfum qui vous correspond grâce à notre conseiller olfactif assisté par intelligence artificielle.',
  alternates: {
    canonical: '/numba/ai-consultant',
  },
};

export default function AiConsultantPage() {
  return (
    <>
      <section className="sr-only">
        <h1>Conseiller parfum IA</h1>
        <p>
          Décrivez vos goûts et découvrez des recommandations de parfums personnalisées.
        </p>
      </section>
      <AiConsultantClient />
    </>
  );
}
