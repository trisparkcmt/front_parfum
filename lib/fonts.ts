import { Lora } from 'next/font/google';

// Preload critical font weights for faster FCP
export const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-serif',
  preload: true,
  fallback: ['ui-serif', 'Georgia', 'serif'],
  display: 'swap', // Show fallback font immediately
});
