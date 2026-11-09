'use client';

import { useEffect, useState } from 'react';
import { shopService } from '@/services/apiService';
import type { CompanyInfo } from '@/types';
import { buildSocialUrl, normalizeSocialUsername } from '@/lib/utils';

export default function TikTokCreatorEmbed() {
  const [tiktokUrl, setTiktokUrl] = useState('https://www.tiktok.com/@accessoires_exclusifs');

  useEffect(() => {
    let isSubscribed = true;
    shopService
      .getCompanyInfos()
      .then((data: CompanyInfo[]) => {
        if (!isSubscribed) return;
        const info = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (info?.tiktok_url) {
          const normalized = buildSocialUrl('tiktok', info.tiktok_url);
          if (normalized) setTiktokUrl(normalized);
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, []);

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
  }, [tiktokUrl]);

  const username = normalizeSocialUsername(tiktokUrl) || 'accessoires_exclusifs';

  return (
    <div className="flex justify-center w-full py-8 px-4 bg-background">
      <div className="w-full max-w-[780px] overflow-hidden rounded-xl bg-background shadow-sm border border-foreground/5">
        <blockquote
          key={tiktokUrl}
          className="tiktok-embed"
          cite={tiktokUrl}
          data-unique-id={username}
          data-embed-type="creator"
          style={{ maxWidth: '780px', minWidth: '288px', margin: '0 auto' }}
        >
          <section>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={`${tiktokUrl}?refer=creator_embed`}
            >
              @{username}
            </a>
          </section>
        </blockquote>
      </div>
    </div>
  );
}
