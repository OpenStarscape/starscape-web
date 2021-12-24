module.exports = {
  mode: 'production',
  entry: { web: __dirname + '/src/index.ts', },
  output: { path: __dirname + '/public', },
  module: {}
};
