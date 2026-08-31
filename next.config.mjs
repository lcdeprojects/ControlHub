/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
