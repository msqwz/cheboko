import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Отключаем строгий режим для ускорения
  reactStrictMode: false,
  
  // Оптимизация изображений
  images: {
    unoptimized: true, // Отключаем оптимизацию для ускорения
    remotePatterns: [],
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
    ],
  },
  
  
  // Оптимизация импортов (временно отключена для фикса ChunkLoadError)
  /*experimental: {
    optimizePackageImports: ['lucide-react', 'clsx'],
  },*/

  // Игнорируем ошибки TS при сборке
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;