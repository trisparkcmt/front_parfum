/**
 * @file app/layout.tsx
 * @description Root Application Layout & Global Context.
 *
 * This is the highest-level component in the Next.js App Router hierarchy.
 * It is responsible for:
 * - Defining the global HTML structure (html, body) and language settings (fr).
 * - Loading and configuring the brand's typography: 'Roboto' as the primary typeface.
 * - Injecting the global CSS stylesheet (globals.css).
 * - Providing a consistent layout wrapper with the `Navbar`, `Footer`, and `ToastProvider`.
 * - Managing SEO metadata such as page titles and descriptions.
 * - Handling client-side hydration issues with `suppressHydrationWarning`.
 */
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
  alternates: {
    canonical: '/',
  },
};

// Removed the static themeColor from here so it can be handled dynamically
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
                // Read saved preference or default to dark
                var theme = localStorage.getItem('ae-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                
                // Match the browser UI color immediately to prevent flash
                var metaColor = theme === 'dark' ? '#171717' : '#ffffff'; 
                
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