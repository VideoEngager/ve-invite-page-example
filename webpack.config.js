const path = require('path');

module.exports = {
  entry: './src/index.js', // The entry point of your application
  // mode: 'production',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    clean: true,
    library: 'ReactComponentLibrary'

  },
  devtool: 'source-map',
  // bail: true,
  watchOptions: {
    ignored: './node_modules/'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/i,
        include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'node_modules')],
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpe?g|gif)$/i, // Match image files
        use: 'file-loader' // Use file-loader to handle image file imports
      }
    ]
  }// or 'development' for non-minified output
};
