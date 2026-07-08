import type { Metadata, Viewport } from "next";
import "./globals.css";
import { lora } from "@/lib/fonts";
import { LayoutWrapper } from "@/components/shared/LayoutWrapper";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { FCMProvider } from "@/components/pwa/FCMProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export const metadata: Metadata = {
  metadataBase: new URL('https://accessoires-exclusifs.vercel.app'),
  title: {
    default: 'Accessoires Exclusifs | Luxe & Création de Parfums',
    template: '%s | Accessoires Exclusifs',
  },
  description: 'Plateforme e-commerce de luxe intégrant une boutique d\'accessoires, de parfumerie de marque, et un atelier de création olfactive assisté par IA.',
  
  // Google Site Verification Key Added Successfully
  verification: {
    google: '5nPGSz3ynU22pUw1Ycf-uzj-WYM1a6yx3GNfRBlFEGM',
  },

  keywords: [
    'accessoires exclusifs',
    'parfums de marque',
    'dupes de parfums',
    'atelier parfum',
    'création parfum',
    'e-commerce luxe',
    'accessoires luxe',
  ],
  authors: [{ name: 'Accessoires Exclusifs' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  openGraph: {
    title: 'Accessoires Exclusifs | Luxe & Création de Parfums',
    description: 'Découvrez notre plateforme e-commerce de luxe, notre boutique d\'accessoires, et notre atelier de création olfactive assisté par IA.',
    url: 'https://accessoires-exclusifs.vercel.app',
    siteName: 'Accessoires Exclusifs',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Accessoires Exclusifs - Atelier de création olfactive assisté par IA',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Accessoires Exclusifs | Luxe & Création de Parfums',
    description: 'Plateforme e-commerce de luxe et atelier de création olfactive assisté par IA.',
    images: ['/og-image.svg'],
  },

  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icons/icon-192x192.jpeg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Accessoires Exclusifs',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: 'https://accessoires-exclusifs.vercel.app',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#C5A059',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full antialiased ${lora.variable}`} suppressHydrationWarning>
      <head>
        {/* Critical inline script for theme — must run before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('ae-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  var metaColor = theme === 'dark' ? '#0b0b0b' : '#ffffff'; 
                  var metaTag = document.querySelector('meta[name="theme-color"]');
                  if (!metaTag) {
                    metaTag = document.createElement('meta');
                    metaTag.setAttribute('name', 'theme-color');
                    document.head.appendChild(metaTag);
                  }
                  metaTag.setAttribute('content', metaColor);
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-gold selection:text-deep-black font-serif" suppressHydrationWarning>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
        <ToastProvider />
        <FCMProvider />
        <InstallPrompt />
      </body>
    </html>
  );
}