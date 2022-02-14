module.exports = {
  resolve: {
    extensions: ['.ts', '.js'],
  },
  entry: './src/main/index.ts',
  module: {
    rules: require('./rules.webpack'),
  },
}
