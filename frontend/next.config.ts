import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // Disable auto generation, use manual service worker
  register: true,
  fallbacks: {
    document: '/offline',
  },
});

const nextConfig: NextConfig = {
  /* config options here */
  
  // Remove console.log in production using Next.js built-in compiler
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'] // Keep console.error and console.warn for debugging
    } : false,
  },
  
  // Disable Fast Refresh completely
  reactStrictMode: false,
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable Fast Refresh logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Compress responses
  compress: true,
  
  // Build performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
        },
      };
    }
    return config;
  },  // Optimasi images
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/api/images/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      // Dynamic pattern based on environment variable
      ...(process.env.NEXT_PUBLIC_BACKEND_URL
        ? [
            {
              protocol: process.env.NEXT_PUBLIC_BACKEND_URL.startsWith('https') ? 'https' as const : 'http' as const,
              hostname: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).hostname,
              port: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).port || '',
              pathname: '/api/images/**',
            },
          ]
        : []),
      // Dynamic pattern for base URL
      ...(process.env.NEXT_PUBLIC_BASE_URL
        ? [
            {
              protocol: process.env.NEXT_PUBLIC_BASE_URL.startsWith('https') ? 'https' as const : 'http' as const,
              hostname: new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname,
              port: new URL(process.env.NEXT_PUBLIC_BASE_URL).port || '',
              pathname: '/api/images/**',
            },
          ]
        : []),
    ],
    // Optimasi untuk mengurangi requests
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  // CORS configuration dan MIME type headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // CSS files
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // JavaScript files
      {
        source: '/_next/static/js/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // PWA Manifest
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Service Worker
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // Workbox files
      {
        source: '/workbox-(.+)\\.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API headers
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  // Redirect API calls to backend
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    return [
      {
        source: '/api/:slug*',
        destination: `${backendUrl}/api/:slug*`,
      },
    ];
  },
};

export default withPWA(nextConfig);
