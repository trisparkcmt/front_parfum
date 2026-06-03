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
import { Lora } from "next/font/google";
import "./globals.css";
import { LayoutWrapper } from "@/components/shared/LayoutWrapper";
import { ToastProvider } from "@/components/shared/ToastProvider";

const lora = Lora({ 
  subsets: ["latin"], 
  variable: "--font-lora",
  display: "swap",
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: "Accessories Exclusif | Luxe & Création de Parfums",
  description: "Plateforme e-commerce de luxe intégrant une boutique d'accessoires, de parfumerie de marque, et un atelier de création olfactive assisté par IA.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Accessories Exclusif",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
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
    <html lang="fr" className={`${lora.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('ae-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
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
      </body>
    </html>
  );
}
