const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    'service-worker': './scripts/service-worker.js',
    'vectorStore': './scripts/vectorStore.js',
    'browserAgent': './scripts/browserAgent.js',
    'browserAgentSetup': './scripts/browserAgentSetup.js',
    'browserControl': './scripts/browserControl.js',
    'sendToEndpoint': './scripts/sendToEndpoint.js',
    'speechHandler': './scripts/speechHandler.js',
    'content-script': './scripts/content-script.js',
    'injectPermissionIframe': './scripts/injectPermissionIframe.js' // Added entry point
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js']
  },
  devtool: 'source-map'
};
