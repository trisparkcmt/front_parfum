import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/shared/LayoutWrapper";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { FCMProvider } from "@/components/pwa/FCMProvider";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export const metadata: Metadata = {
  metadataBase: new URL('https://accessoires-exclusifs.vercel.app'),
  title: "Accessoires Exclusifs | Luxe & Création de Parfums",
  description: "Plateforme e-commerce de luxe intégrant une boutique d'accessoires, de parfumerie de marque, et un atelier de création olfactive assisté par IA.",
  
  // 1. OPEN GRAPH (For WhatsApp, LinkedIn, Facebook sharing optimization)
  openGraph: {
    title: "Accessoires Exclusifs | Luxe & Création de Parfums",
    description: "Découvrez notre plateforme e-commerce de luxe, notre boutique d'accessoires, et notre atelier de création olfactive assisté par IA.",
    url: 'https://accessoires-exclusifs.vercel.app',
    siteName: 'Accessoires Exclusifs',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg', // Place a 1200x630px image in your public/ folder
        width: 1200,
        height: 630,
        alt: 'Accessoires Exclusifs - Atelier de création olfactive assisté par IA',
      },
    ],
  },

  // 2. TWITTER / X CARD
  twitter: {
    card: 'summary_large_image',
    title: "Accessoires Exclusifs | Luxe & Création de Parfums",
    description: "Plateforme e-commerce de luxe et atelier de création olfactive assisté par IA.",
    images: ['/og-image.jpg'],
  },

  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/icons/icon-192x192.jpeg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Accessoires Exclusifs",
  },
  formatDetection: {
    telephone: false,
  },
  
  // 3. FIXED CANONICAL URL (Next.js automatically handles appending nested pathnames if set to '')
  alternates: {
    canonical: '',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
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
        }} />
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