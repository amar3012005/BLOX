module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        function ignoreSourcemapsloaderWarnings(warning) {
          return (
            warning.module?.resource?.includes('node_modules') &&
            warning.details?.includes('source-map-loader')
          );
        },
      ],
    },
  },
};
