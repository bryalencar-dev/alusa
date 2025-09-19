import { dirname, resolve as resolvePath } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Evita falhas no build devido à configuração ESLint da raiz (fora do workspace)
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@alusa/lib', '@alusa/ui'],
  webpack: (config) => {
    // Alias direto para o pacote do monorepo (fallback robusto para pnpm)
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@alusa/lib'] = resolvePath(__dirname, '../../packages/lib/dist');
    return config;
  },
};

export default nextConfig;
