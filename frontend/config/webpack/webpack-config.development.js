// Webpack configuration for development environments
const webpack = require('webpack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')

module.exports = {
  devtool: 'cheap-source-map', // 'eval-source-map',

  output: {
    filename: '[name].bundle.js',
    sourceMapFilename: '[file].map[query]',
    chunkFilename: '[id].[chunkhash].js',
    pathinfo: false,
  },

  optimization: {
    moduleIds: 'named',
    chunkIds: 'named',
  },

  plugins: [
    new BundleAnalyzerPlugin({
      analyzerPort: 'auto',
      openAnalyzer: false,
    }),
    new ReactRefreshWebpackPlugin(),
  ],
}
