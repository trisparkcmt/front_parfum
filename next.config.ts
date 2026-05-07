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
  /* config options here */
};
module.exports = {
  allowedDevOrigins: ['172.20.10.2'],
}

export default nextConfig;
