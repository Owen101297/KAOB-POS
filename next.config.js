/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['pos.vendty.com', 'vendty-img-new.s3.us-east-2.amazonaws.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['bcryptjs'],
  },
};

module.exports = nextConfig;
