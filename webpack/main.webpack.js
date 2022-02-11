module.exports = {
  resolve: {
    extensions: ['.ts', '.js'],
  },
  entry: './src/main/main.ts',
  module: {
    rules: require('./rules.webpack'),
  },
}
