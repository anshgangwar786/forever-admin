import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));

// NEXT_PUBLIC_* values are inlined at build time; a production build without them would
// silently ship localhost URLs, so fail fast instead.
const REQUIRED_PUBLIC_ENV = ["NEXT_PUBLIC_BACKEND_URL", "NEXT_PUBLIC_STORE_URL"];
if (process.env.NODE_ENV === 'production') {
  const missing = REQUIRED_PUBLIC_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required build-time env vars: ${missing.join(', ')}`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  // Each app is self-contained; stops Next picking the monorepo root as the tracing root
  outputFileTracingRoot: appDir,
  images: {
    // Only allow known media hosts so /_next/image can't be used as an open proxy
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
