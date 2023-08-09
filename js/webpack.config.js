const path = require('path');
const { merge } = require('webpack-merge');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(
  require('flarum-webpack-config')(),
  {
    output: {
      chunkFilename: 'chunk~[name].js',
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              evaluate: false, // fix for image-blob-reduce
              passes: 2, // default value
            },
          },
        })
      ],
      sideEffects: false, // fix for image-blob-reduce
    },
    plugins: [
      new CleanWebpackPlugin({
        dry: false,
        dangerouslyAllowCleanPatternsOutsideProject: true,
        cleanOnceBeforeBuildPatterns: [path.resolve(process.cwd(), '../assets/*'), path.resolve(process.cwd(), 'dist/*')],
      }),
      new FileManagerPlugin({
        events: {
          onEnd: {
            copy: [{ source: 'dist/chunk*', destination: '../assets/' }],
          },
        },
      }),
    ],
  }
);
