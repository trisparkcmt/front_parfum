'use client';

import { useEffect } from 'react';

export default function TikTokCreatorEmbed() {
  useEffect(() => {
    // Add TikTok's embed script dynamically when the component mounts
    const scriptId = 'tiktok-embed-script';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="flex justify-center w-full py-8 px-4 bg-background">
      <div className="w-full max-w-[780px] overflow-hidden rounded-xl bg-background shadow-sm border border-foreground/5">
        <blockquote
          className="tiktok-embed"
          cite="https://www.tiktok.com/@accessoires_exclusifs"
          data-unique-id="accessoires_exclusifs"
          data-embed-type="creator"
          style={{ maxWidth: '780px', minWidth: '288px', margin: '0 auto' }}
        >
          <section>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.tiktok.com/@accessoires_exclusifs?refer=creator_embed"
            >
              @accessoires_exclusifs
            </a>
          </section>
        </blockquote>
      </div>
    </div>
  );
}
