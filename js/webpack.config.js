const webpack = require('webpack');
const { merge } = require('webpack-merge');

module.exports = merge(
  require('flarum-webpack-config')(),
  {
    node: {
      fs: 'empty'
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.browser': 'true'
      }),
    ],
  }
);
