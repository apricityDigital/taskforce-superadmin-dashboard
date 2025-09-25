/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/taskforce-superadmin-dashboard',
  assetPrefix: '/taskforce-superadmin-dashboard/', // ✅ Important for GitHub Pages
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  
};

module.exports = nextConfig;
