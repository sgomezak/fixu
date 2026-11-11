import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Bundled fixtures snapshot is read at runtime by the fixtures route.
  outputFileTracingIncludes: { '/api/fixtures': ['./data/fixtures/**'], '/health': ['./data/garmin/**'] },
};

export default withSerwist(nextConfig);
