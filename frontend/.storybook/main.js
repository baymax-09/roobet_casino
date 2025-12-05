const path = require('path');
const SourcePath = path.resolve(__dirname, '../src');
const AssetsPath = path.resolve(__dirname, '../assets');
const IconsPath = path.resolve(__dirname, '../assets/icons');
const config = {
  stories: [{
    directory: "../src/mrooi",
    files: '**/*.stories.@(mdx|tsx|ts)'
  }],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/preset-scss", '@storybook/addon-mdx-gfm'],
  staticDirs: ['../assets/'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: {
        fastRefresh: true
      }
    }
  },
  webpackFinal: async config => {
    config.resolve.modules = [SourcePath, 'node_modules', AssetsPath];

    config.module.rules
      .filter(rule => rule?.test?.test('.svg'))
      .forEach(rule => rule.exclude = IconsPath)

    config.module.rules.push({
      test: /\.svg$/,
      use: [{
        loader: '@svgr/webpack'
      }],
      include: IconsPath
    });
    config.resolve.extensions = ['.js', '.jsx', '.ts', '.tsx'];
    config.resolve.alias = {
      src: SourcePath,
      app: path.resolve(SourcePath, 'app'),
      admin: path.resolve(SourcePath, 'admin'),
      vendors: path.resolve(SourcePath, 'vendors'),
      common: path.resolve(SourcePath, 'common'),
      assets: AssetsPath,
      mrooi: path.resolve(SourcePath, 'mrooi'),
      '/images': path.resolve(AssetsPath, 'images'),
      'react-helmet': 'react-helmet-async',
      assert: 'assert',
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      process: 'process/browser',
      stream: 'stream-browserify',
      util: 'util'
    };
    return config;
  },
  // Creates documentation for each story automatically :)
  docs: {
    autodocs: true
  }
};
export default config;