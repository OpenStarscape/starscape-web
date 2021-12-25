module.exports = {
  mode: 'production',
  entry: { code: __dirname + '/src/index.ts', },
  output: { path: __dirname + '/public', },
  module: {},
  options: {
    minify: true,
    jsc: {
      minify: {
        compress: true,
        mangle: {
          properties: {},
          topLevel: false,
        }
      },
    },
  }
};
