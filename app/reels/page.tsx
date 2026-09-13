import Script from 'next/script';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nos Reels TikTok | Accessoires Exclusifs',
  description: 'Découvrez nos dernières vidéos, tutoriels et nouveautés sur notre feed TikTok.',
};

export default function ReelsPage() {
  return (
    <div className="min-h-screen flex flex-col pt-24 pb-12 px-4 max-w-7xl mx-auto w-full">
      <div className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 text-foreground">
          Nos <span className="text-gold">Reels</span>
        </h1>
        <p className="text-foreground/70 max-w-2xl mx-auto text-lg">
          Plongez dans l'univers d'Accessoires Exclusifs à travers nos dernières vidéos TikTok. 
          Découvrez nos créations, nos conseils et nos nouveautés en vidéo.
        </p>
      </div>

      {/* Elfsight Widget Container */}
      <div className="flex-grow w-full rounded-2xl overflow-hidden bg-background">
        <div className="elfsight-app-a0e592ca-ab39-497f-b9de-40b8b75fd819" data-elfsight-app-lazy></div>
      </div>

      {/* Load the Elfsight platform script securely using Next.js Script */}
      <Script 
        src="https://elfsightcdn.com/platform.js" 
        strategy="lazyOnload" 
      />
    </div>
  );
}
