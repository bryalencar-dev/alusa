// Tipagem reduzida para compatibilidade de versão Storybook instalada
const config = {
  stories: ['../components/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/react',
    options: {}
  },
  docs: { autodocs: 'tag' }
};

export default config;
