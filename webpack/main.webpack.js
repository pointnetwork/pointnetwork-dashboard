const webpack = require("webpack");

module.exports = {
  resolve: {
    extensions: ['.ts', '.js']
  },
  entry: './electron/main.ts',
  module: {
    rules: require('./rules.webpack'),
  }
}