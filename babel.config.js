const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: [path.resolve(__dirname, 'src')],
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
          alias: {
            '@assets': './src/assets',
            '@axios': './src/axios',
            '@components': './src/components',
            '@config': './src/config',
            '@constant': './src/constant',
            '@hooks': './src/hooks',
            '@navigation': './src/navigation',
            '@screens': './src/screens',
            '@appTypes': './src/types',
            '@utils': './src/utils',
            '@theme': './src/theme',
          },
        },
      ],
    ],
  };
};