module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
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
