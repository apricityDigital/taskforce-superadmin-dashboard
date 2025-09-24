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
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA4A0D3iU2wDqRQ1nZ7ephtgNPz65Qc16Y",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "taskforce-22162.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "taskforce-22162",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "taskforce-22162.appspot.com",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "106582224531",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:106582224531:web:7aa3faa5c8b458fc54a766"
  }
};

module.exports = nextConfig;
