const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Basic configuration for Expo
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs'];
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

// Add support for TTF files
config.resolver.assetExts.push('ttf');

// Add vendor directory to the resolver
config.resolver.extraNodeModules = {
  'react-native-vector-icons': require.resolve('@expo/vector-icons'),
  'events': require.resolve('events/'),
};

// Create a mock for idb
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Replace Node.js specific imports with browser versions
  if (moduleName === 'events') {
    return {
      filePath: require.resolve('events/'),
      type: 'sourceFile',
    };
  }
  
  // Mock idb for React Native
  if (moduleName === 'idb') {
    return {
      filePath: require.resolve('./mocks/idb-mock.js'),
      type: 'sourceFile',
    };
  }
  
  // Handle Firebase postinstall.mjs
  if (moduleName === '@firebase/util/dist/postinstall.mjs') {
    return {
      filePath: require.resolve('./mocks/firebase-postinstall-mock.js'),
      type: 'sourceFile',
    };
  }
  
  if (moduleName.startsWith('@firebase/')) {
    const path = require.resolve(moduleName)
      .replace('.node.cjs.js', '.esm2017.js')
      .replace('/dist/index.node.', '/dist/index.esm2017.');
    return {
      filePath: path,
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config; 