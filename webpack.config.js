const path = require('path');
const Visualizer = require('webpack-visualizer-plugin');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  output: {
    library: 'Shepherd',
    filename: 'shepherd.min.js',
  },

  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
    },
    extensions: ['.ts', '.js'],
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
      },
    ],
  },

  plugins: [new Visualizer()],
};
