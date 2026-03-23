import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-webpack5-compiler-swc',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  swc: () => ({
    jsc: {
      transform: {
        react: {
          runtime: 'automatic',
        },
      },
    },
  }),
  typescript: {
    reactDocgen: false,
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Mock @superset-ui packages for standalone Storybook
      // (peerDependencies, not installed — stories use pre-built mock data)
      '@superset-ui/core': path.resolve(__dirname, 'superset-core-mock.ts'),
      '@superset-ui/chart-controls': path.resolve(__dirname, 'superset-core-mock.ts'),
    };
    return config;
  },
};

export default config;
