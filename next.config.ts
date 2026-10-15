/**
 * @file next.config.ts
 * @description Main Application Configuration for Next.js.
 *
 * This file defines the high-level behavior of the Next.js framework for the project.
 * It is responsible for:
 * - Enabling/disabling experimental features (e.g., partial pre-rendering).
 * - Configuring image domains and patterns for AI-generated and external assets.
 * - Setting up environment-specific build configurations.
 * - Overriding default Webpack or Turbo settings if necessary.
 *
 * It utilizes the `NextConfig` type to ensure configuration options are valid.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Allowed dev origins for local network testing and Ngrok tunnels
  allowedDevOrigins: [
    '172.20.10.2',
    '172.20.10.5', 
    '192.168.1.173', 
    'bodacious-purple-gaffe.ngrok-free.dev',
    'api.accessoiresexclusifs.com',
    '0.0.0.0'
  ],

  // 2. 301 redirects — old WordPress/WooCommerce URLs → new Next.js pages.
  //    Google crawled these old URLs and they now cause "Duplicate without
  //    user-selected canonical" errors in Search Console.
  async redirects() {
    return [
      // /index.php/categorie-produit/parfums/* → /shop/perfumes
      {
        source: '/index.php/categorie-produit/parfums/:path*',
        destination: '/shop/perfumes',
        permanent: true,
      },
      // /index.php/categorie-produit/accessoires/* → /shop/accessories
      {
        source: '/index.php/categorie-produit/accessoires/:path*',
        destination: '/shop/accessories',
        permanent: true,
      },
      // /index.php/categorie-produit/diffuseurs/* → /shop/diffuseurs
      {
        source: '/index.php/categorie-produit/diffuseurs/:path*',
        destination: '/shop/diffuseurs',
        permanent: true,
      },
      // Any remaining /index.php/* WordPress path → home
      {
        source: '/index.php/:path*',
        destination: '/',
        permanent: true,
      },
      // Bare /index.php → home
      {
        source: '/index.php',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // 3. Image optimization rules for your Django backend and CDNs
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ngrok-free.app',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ngrok.io',
        pathname: '/**',
      },
      {
        // Allow any https origin (production CDN / S3 etc.)
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.accessoiresexclusifs.com',
        pathname: '/**',
      },
      {
        // Allow local Django dev server
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;