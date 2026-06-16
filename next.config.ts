/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Це потрібно, щоб картинки і стилі правильно завантажувалися за тимчасовим посиланням GitHub
  basePath: '/azhunebi-menu', 
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;