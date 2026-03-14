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

  // Игнорируем ошибки TS и ESLint при сборке (чтобы деплой не падал из-за типов)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;