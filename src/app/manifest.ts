import type { MetadataRoute } from 'next';
import { t } from '@/lib/i18n/en';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: t.app.name,
    short_name: t.app.name,
    description: t.app.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f4efe6',
    theme_color: '#f4efe6',
    lang: 'en',
    categories: ['productivity', 'lifestyle', 'health'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  };
}
