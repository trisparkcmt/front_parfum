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
  allowedDevOrigins: ['172.20.10.2','172.20.10.5', '192.168.1.173', 'bodacious-purple-gaffe.ngrok-free.dev','accessoires-exclusifs-api.onrender.com','0.0.0.0'],
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
        // Allow local Django dev server
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
