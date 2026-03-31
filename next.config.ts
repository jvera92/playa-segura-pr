import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  // unsafe-inline required: React inline style props + dangerouslySetInnerHTML SW script
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Beach photos (Unsplash) + Puerto Rico flag (flagcdn)
  "img-src 'self' https://images.unsplash.com https://flagcdn.com data: blob:",
  // Google Fonts glyphs loaded by next/font
  "font-src 'self' https://fonts.gstatic.com",
  // All API calls are same-origin (/api/*)
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "DENY" },
  { key: "X-XSS-Protection",          value: "1; mode=block" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy",   value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
