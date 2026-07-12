/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: [path.resolve(__dirname, 'src')], // ← 절대경로로 변경
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
        },
      },
    ],
  ],
};
