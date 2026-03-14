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
  
  // Режим standalone для деплоя на хостинг
  output: 'standalone',
  
  // Кэширование
  experimental: {
    optimizePackageImports: ['lucide-react', 'clsx'],
  },
};

export default nextConfig;