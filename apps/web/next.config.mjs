/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Evita falhas no build devido à configuração ESLint da raiz (fora do workspace)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
