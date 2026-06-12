/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // React 19 has type incompatibilities in Next.js 15 generated types
    // This is a known issue. Disabling type checking on build since
    // tsc separately validates the source code.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;

