module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        alias: {
          '@app': './app',
          '@components': './app/components',
          '@services': './app/services',
          '@config': './app/config',
          '@types': './app/types',
        },
      }],
      'react-native-reanimated/plugin',
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: true,
        allowUndefined: false,
      }],
    ],
  };
}; 