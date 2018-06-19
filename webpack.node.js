const path = require('path');
const Visualizer = require('webpack-visualizer-plugin');

module.exports = {
  entry: './src/index.ts',
  mode: 'production',
  target: 'node',
  output: {
    filename: 'shepherd.node.js',
  },

  externals: {
    lodash: 'lodash',
    jsonschema: 'jsonschema',
    'bn.js': 'bn.js',
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

  plugins: [
    new Visualizer({
      filename: 'stats-node.html',
    }),
  ],
};
