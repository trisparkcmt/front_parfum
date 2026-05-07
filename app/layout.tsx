/**
 * @file app/layout.tsx
 * @description Root Application Layout & Global Context.
 *
 * This is the highest-level component in the Next.js App Router hierarchy.
 * It is responsible for:
 * - Defining the global HTML structure (html, body) and language settings (fr).
 * - Loading and configuring the brand's typography: 'Playfair Display' for headlines and 'Inter' for body text.
 * - Injecting the global CSS stylesheet (globals.css).
 * - Providing a consistent layout wrapper with the `Navbar`, `Footer`, and `ToastProvider`.
 * - Managing SEO metadata such as page titles and descriptions.
 * - Handling client-side hydration issues with `suppressHydrationWarning`.
 */
import type { Metadata, Viewport } from "next";
import { Roboto as roboto } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ToastProvider } from "@/components/shared/ToastProvider";
import BottomNav from "@/components/shared/BottomNav";

const robotoMono = roboto({ subsets: ["latin"], variable: "--font-roboto" });

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
  themeColor: "#C5A059",
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
    <html lang="fr" className={`${robotoMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-gold selection:text-deep-black font-mono">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <BottomNav />
        <Footer />
        <ToastProvider />

      </body>
    </html>
  );
}
