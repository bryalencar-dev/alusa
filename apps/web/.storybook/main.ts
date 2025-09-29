import type { StorybookConfig } from '@storybook/nextjs';

// Configuração Storybook 8.6 para Next.js usando o framework '@storybook/nextjs'
// Mantém autodocs por tag e addons essenciais + interactions.
const config: StorybookConfig = {
  stories: [
    '../**/*.mdx',
    '../**/*.stories.@(js|jsx|ts|tsx)',
    // Padrão específico anterior (mantido por compatibilidade / organização):
    '../components/**/*.stories.@(ts|tsx|mdx)',
  ],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/nextjs',
    options: {
      // Você pode adicionar aqui opções específicas do preset Next.js caso precise (nextConfigPath, builder, etc.)
    },
  },
  docs: { autodocs: 'tag' },
};

export default config;
