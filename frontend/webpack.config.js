// Roobet Product Webpack Configuration
// Additional environmental webpack configuration files can be found inside of `config/webpack`

const dotenv = require('dotenv')
const path = require('path')
const { merge } = require('webpack-merge')

const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const BundleAnalyzerPlugin =
  require('webpack-bundle-analyzer').BundleAnalyzerPlugin

// Pull .env values into process.env.
dotenv.config()

/**
 * TODO: Move this documentation into our building docs on Confluence?
 *
 * An entry bundle can be targeted by passing the 'BUILD_TARGET' environmental
 * variable as the bundle's entry key.
 *
 * Alternatively, multiple entries can be built simply by passing a comma-separated
 * list of the entry bundle keys to be targeted
 *
 * NOTE: If a BUILD_TARGET has not been supplied, all entry bundles will
 * then be targeted
 *
 * [CLI EXAMPLE] Setting the Targeted Build Entries
 *
 * # ... via environmental variables (cross-env required for Windows)
 * $ cross-env BUILD_TARGET=acp
 * $ cross-env BUILD_TARGET=acp,product
 *
 * # ... via Webpack CLI
 * $ webpack --env.BUILD_TARGET=acp ...
 * $ webpack --env.BUILD_TARGET=acp,product
 *
 * [BUILD NOTES]
 *
 * [-] If a BUILD_TARGET has not been supplied, all entry bundles will then be targeted
 * [-] Any non-admin entries should never import any code from the admin module to "prevent"
 * leaking our ACP internals as much as possible to those who don't have any access
 */

/* Project Directories */
const ContextPath = path.resolve(__dirname)
const SourcePath = path.resolve(__dirname, 'src')
const AssetsPath = path.resolve(__dirname, 'assets')
const IconsPath = path.resolve(__dirname, 'assets/icons')
const TargetsOutputPath = path.resolve(__dirname, 'dist')

/* Environment Variables */
const isProduction = process.env.NODE_ENV === 'production'

// SharedBundles are entries commonly shared between apps
// TODO: Get rid of this!!
const SharedBundles = {
  shared: ['common/icons', 'common/polyfill', 'common/bootstrap'],
}

// BuildTargets contains a map of available entries that can be targeted
const BuildTargets = {
  product: {
    entry: {
      ...SharedBundles,

      product: {
        import: ['app/util/windowHelpers', 'app/main'],
        dependOn: ['shared'],
      },
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(SourcePath, 'index.html'),
        filename: 'index.html',
        inject: 'body',
      }),
    ],
  },

  acp: {
    entry: {
      ...SharedBundles,
      acp: ['admin/main'],
    },

    resolve: {
      alias: {
        // Keep admin resolutions out of any other entry as precaution
        admin: path.resolve(SourcePath, 'admin'),
      },
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(SourcePath, 'admin.html'),
        filename: 'index.html',
        inject: 'body',
      }),
    ],
  },
}

/**
 * getModuleRootName parses the module identifier and returns the root
 * directory of the component
 *
 * Example:
 * Identifier: R:\roobet\atlanta-frontend\src\app\dialogs\AccountDialog\index.js
 * Root Name: AccountDialog
 */
function getModuleRootName(identifier) {
  const root = `src${path.sep}app${path.sep}`
  const idx = identifier.indexOf(root)

  if (idx < 0) {
    return null
  }

  const parts = identifier.substring(idx + root.length).split(path.sep)

  if (parts.length > 2) {
    const last = parts[parts.length - 1]
    const idx = last.indexOf('.ts')

    // If it ends with a .js extension remove it from the name
    if (idx > 0) {
      parts.splice(0, 1)

      const name = last.substring(0, idx)

      // If it ends with index, just remove it instead
      if (name === 'index') {
        parts.splice(parts.length - 1)
      } else {
        parts[parts.length - 1] = name
      }
    }

    // Lastly, remove any duplicates to clean it out, shouldn't collide with any other one
    return Array.from(new Set(parts)).join('-')
  }

  return parts[0]
}

// useModuleRootAsCacheName uses the module's root name as the name for the
// chunk name
function useModuleRootAsChunkName(prefix = null) {
  return (module, _ /* chunks */, cacheGroupKey) => {
    const root = getModuleRootName(module.identifier())
    return `${prefix || cacheGroupKey}/${root.toLowerCase()}`
  }
}

/**
 * Build the Webpack Config
 *
 * 1.) Extend the default configuration by merging environmental specific config
 * entries configuration
 * 2.) For every targeted entry bundle we clone the config and extend it with the
 */
function buildEntryBundle(webpackConfig, bundleId, bundleWebpackConfig) {
  const defaultConfig = {
    experiments: {
      topLevelAwait: true,
      asyncWebAssembly: true,
    },

    cache: {
      type: 'filesystem',
    },

    context: ContextPath,

    entry: {},

    output: {
      path: path.resolve(TargetsOutputPath, bundleId),
      globalObject: 'this',
      clean: true,
      assetModuleFilename: '[path][name].[contenthash][ext]',
    },

    devServer: {
      hot: true,
      historyApiFallback: true,
      allowedHosts: 'all',
      static: {
        directory: AssetsPath,
        watch: true,
      },
    },

    /**
     * We needed to add dev dependencies and aliases for using Crypto Wallets and onboard.js
     * https://docs.blocknative.com/onboard/react-hooks#build-environments
     */
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        src: SourcePath,
        app: path.resolve(SourcePath, 'app'),
        vendors: path.resolve(SourcePath, 'vendors'),
        common: path.resolve(SourcePath, 'common'),
        assets: AssetsPath,
        mrooi: path.resolve(SourcePath, 'mrooi'),
        // TODO: Remove once all images are hashed; On ROOB-1536 completion
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
        util: 'util',
      },
    },

    module: {
      rules: [
        {
          test: /\.svg$/i,
          issuer: /\.[jt]sx?$/,
          use: ['@svgr/webpack'],
          include: IconsPath,
        },
        {
          test: [/\.stories.*/],
          exclude: [SourcePath],
        },
        {
          test: /\.(j|t)s(x?)$/,
          include: SourcePath,
          use: [
            {
              loader: 'swc-loader',
            },
          ],
        },

        {
          test: /\.css$/i,
          include: [path.resolve(__dirname, 'node_modules')],
          use: [MiniCssExtractPlugin.loader, 'css-loader'],
        },
        {
          test: /\.(sa|sc|c)ss$/,
          include: [SourcePath],
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: '../',
                esModule: false,
                // hot: true // \!isProduction
              },
            },
            {
              loader: 'css-loader',
              options: {
                sourceMap: !isProduction,
                importLoaders: 1,
                modules: {
                  localIdentName: '[local]_[hash:base64:5]',
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: !isProduction,
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|webp)$/,
          include: [AssetsPath, SourcePath, IconsPath],
          type: 'asset/resource',
        },
        {
          test: /\.eot(\?v=\d+.\d+.\d+)?$/,
          include: AssetsPath,
          type: 'asset/resource',
        },
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          include: AssetsPath,
          type: 'asset/inline',
        },
        {
          test: /\.[ot]tf(\?v=\d+.\d+.\d+)?$/,
          include: AssetsPath,
          type: 'asset/inline',
        },
        {
          test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
          include: [AssetsPath, SourcePath],
          type: 'asset/resource',
          exclude: IconsPath,
        },
        {
          test: /\.wav(\?v=\d+\.\d+\.\d+)?$/,
          include: AssetsPath,
          type: 'asset/inline',
        },
        {
          test: /\.mp3(\?v=\d+\.\d+\.\d+)?$/,
          include: AssetsPath,
          type: 'asset/inline',
        },
        {
          test: /\.ogg(\?v=\d+\.\d+\.\d+)?$/,
          include: AssetsPath,
          type: 'asset/inline',
        },
      ],
    },

    plugins: [
      // Only include env variables that are prefixed with ROOBET_
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(
          Object.fromEntries(
            Object.entries(process.env).filter(([key]) => {
              return key.startsWith('ROOBET_')
            }),
          ),
        ),
      }),

      // Very deliberately parse analyze argument from process.
      ...(process.argv.includes('--analyze')
        ? [
            new BundleAnalyzerPlugin({
              statsOptions: {
                nestedModules: true,
              },
            }),
          ]
        : []),

      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),

      new MiniCssExtractPlugin({
        filename: !isProduction ? '[name].css' : '[name].[contenthash].css',
        chunkFilename: !isProduction ? '[id].css' : '[id].[contenthash].css',
        // Suppress inconsequential order warnings from using React.lazy.
        ignoreOrder: true,
      }),

      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/vendors', to: '' },
          { from: 'src/robots.txt', to: '' },
          { from: 'src/robots-disallow.txt', to: '' },
          { from: path.join(AssetsPath, 'sitemap.xml'), to: '' },
          // TODO: Remove once all images are hashed; On ROOB-1536 completion
          { from: path.join(AssetsPath, 'images'), to: 'images' },
          { from: path.join(AssetsPath, 'sounds'), to: 'sounds' },
          { from: path.join(AssetsPath, 'resources'), to: 'resources' },
          // TODO: Just put the files in this folder??
          {
            from: path.join(AssetsPath, 'crash', 'rockets'),
            to: 'images/games/crash/rockets',
          },

          ...(bundleId === 'product'
            ? [
                { from: 'src/game.html', to: '' },
                { from: 'src/game-softswiss.html', to: '' },
                { from: 'src/challenge.html', to: '' },
                {
                  from: 'assets/images',
                  to: 'assets/images/[path][name].[contenthash][ext]',
                  toType: 'template',
                },
                {
                  from: 'src/cx',
                  to: 'cx',
                  globOptions: {
                    ignore: ['**/*.+(md|htm)'], // Block test.html and README.md, allow p.html|js.
                  },
                },
              ]
            : []),

          // Move CF headers file to correct build output.
          // Removing this step temporarily to debug a possible build issue.
          // { from: bundleId === 'acp' ? 'src/admin/_headers' : 'src/app/_headers', to: '' },

          // Only copy the following for the ACP bundle.
          ...(bundleId === 'acp'
            ? [{ from: path.join(AssetsPath, 'admin'), to: 'assets' }]
            : []),
        ],
      }),

      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],

    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,

        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            // Should we do all chunks? Not sure, using initial sounds like it makes more sense
            // as it would decrease load times
            chunks: 'initial',
            priority: -10,
            reuseExistingChunk: true,
          },

          dialogs: {
            test: /src[\\/]app[\\/]dialogs[\\/]/,
            chunks: 'async',
            name: useModuleRootAsChunkName(),
            priority: -5,
            reuseExistingChunk: true,
          },

          commons: {
            test: /src[\\/]common[\\/]/,
            chunks: 'initial',
            name: 'commons',
            priority: 1,
          },
        },
      },
    },
  }

  return merge(defaultConfig, webpackConfig, bundleWebpackConfig)
}

// Load the current environment's webpack configuration and start merging
module.exports = (env = {}) => {
  const target = (() => {
    if (process.env.BUILD_TARGET) {
      return process.env.BUILD_TARGET
    }

    if (env.BUILD_TARGET) {
      return env.BUILD_TARGET
    }

    // Default to product for the dev server.
    if (env.WEBPACK_SERVE) {
      return 'product'
    }

    return undefined
  })()

  if (target && typeof BuildTargets[target] === 'undefined') {
    throw new Error(
      `"${target}" is not a valid build target (available: ${Object.keys(
        BuildTargets,
      ).join(', ')})`,
    )
  }

  const envWebpackConfig = require(
    `./config/webpack/webpack-config.${
      isProduction ? 'production' : 'development'
    }.js`,
  )

  // Build specified target.
  if (target) {
    return buildEntryBundle(envWebpackConfig, target, BuildTargets[target])
  }

  // Default to build all targets.
  if (!target || env.WEBPACK_BUILD) {
    return Object.keys(BuildTargets).map(name =>
      buildEntryBundle(envWebpackConfig, name, BuildTargets[name]),
    )
  }
}
