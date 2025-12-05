const webpack = require('webpack')
const zlib = require('zlib')
const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin');

const DebugChunkLoadPluginName = 'DebugChunkLoadPlugin'

class DebugChunkLoadPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(DebugChunkLoadPluginName, compilation => {
      const { mainTemplate } = compilation;

      mainTemplate.hooks.localVars.tap(
        { name: DebugChunkLoadPluginName, stage: 1 },
        (source) => {
          const script = `
            (() => {
              if (typeof __webpack_require__ !== 'undefined') {
                var oldLoadScript = ${webpack.RuntimeGlobals.loadScript};
            
                ${webpack.RuntimeGlobals.loadScript} = function loadScript(url, oldDone, key, chunkId) {
                  var done = function (event) {
                    if (event.type === 'error') {
                      console.info('loadScript event', {
                        isTrusted: event.isTrusted,
                        bubbles: event.bubbles,
                        cancelBubble: event.cancelBubble,
                        cancelable: event.cancelable,
                        composed: event.composed,
                        currentTarget: event.currentTarget,
                        defaultPrevented: event.defaultPrevented,
                        eventPhase: event.eventPhase,
                        returnValue: event.returnValue,
                        srcElement: event.srcElement,
                        target: event.target,
                        timeStamp: event.timeStamp,
                        type: event.type,
                      });
                    }
            
                    oldDone(event);
                  };
            
                  oldLoadScript(url, done, key, chunkId);
                };
              }
            })();`

          return source + script
        }
      );
    });
  }
}

module.exports = {
  devtool: 'hidden-source-map',
  mode: 'production',

  output: {
    filename: '[contenthash].b.js',
    chunkFilename: '[contenthash].c.js',
    sourceMapFilename: '[file].map',
    scriptType: 'text/javascript'
  },

  optimization: {
    mangleExports: 'deterministic',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    runtimeChunk: 'single',
    usedExports: true,

    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,

        terserOptions: {
          mangle: true,
          keep_fnames: false,

          format: {
            comments: false,
          },
        },
      }),

      new CssMinimizerPlugin(),
    ],
  },

  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),

    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),

    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        },
      },
    }),

    new RetryChunkLoadPlugin({
      maxRetries: 2,
    }),

    new DebugChunkLoadPlugin(),
  ],
}
