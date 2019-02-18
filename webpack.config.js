'use strict';
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const path = require('path');

const CONTEXT_PATH = path.resolve(__dirname);
const DIST_PATH = `${CONTEXT_PATH}/dist/compiled/`;
const SRC_PATH = `${CONTEXT_PATH}/src`;

module.exports = {
  mode: 'production',
  context: CONTEXT_PATH,
  entry: [
    `${SRC_PATH}/ts/background.ts`
  ],
  output: {
    publicPath: '/',
    path: DIST_PATH,
    filename: 'bundle.min.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' }
    ]
  },
  optimization: {
    minimizer: [new UglifyJsPlugin()],
  },
  plugins: [
    new CleanWebpackPlugin([DIST_PATH], {allowExternal: true}),
    new CopyPlugin([
      { from: 'resources', to: `${DIST_PATH}/resources` }
    ])
  ]
};
