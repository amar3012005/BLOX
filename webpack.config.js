module.exports = {
  // ...existing config...
  ignoreWarnings: [
    {
      module: /node_modules\/@scure\/bip39/,
    },
  ],
  module: {
    rules: [
      // ...existing rules...
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules\/@scure\/bip39/
        ],
      },
    ],
  },
  // ...existing config...
};
