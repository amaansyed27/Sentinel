const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: './popup.js',
    background: './background.js',
    content: './content.js',
    settings: './settings.js',
    linkMarkers: './linkMarkers.js' // Add this line
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '' },
        { from: 'popup.html', to: '' },
        { from: 'settings.html', to: '' },
        { from: 'config.js', to: '' },
        { from: 'popup.css', to: '' },
        { from: 'icons', to: 'icons' }
      ],
    }),
  ],
};
