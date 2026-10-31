import type { Metadata } from 'next';
import QuizClient from './QuizClient';

export const metadata: Metadata = {
  title: 'Quiz parfum personnalisé',
  description:
    'Répondez à quelques questions sur vos goûts pour découvrir votre profil olfactif et une formule parfum adaptée.',
  alternates: {
    canonical: '/numba/quiz',
  },
};

export default function PerfumeQuizPage() {
  return <QuizClient />;
}
