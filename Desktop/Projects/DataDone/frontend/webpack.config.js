const webpack = require('webpack');

module.exports = {
  // ... other configurations ...
  resolve: {
    fallback: {
      zlib: require.resolve('browserify-zlib'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};