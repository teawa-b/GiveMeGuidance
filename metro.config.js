const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Check if we're running in Expo Go by looking at environment variables
// EAS builds and development builds set specific env vars
const isExpoGo = !process.env.EAS_BUILD && !process.env.EXPO_DEV_CLIENT;

if (isExpoGo) {
  console.log('[Metro] Running in Expo Go mode - using ads mock');
  
  // Store the original resolver
  const originalResolver = config.resolver.resolveRequest;

  // Override the resolver to provide a mock for react-native-google-mobile-ads in Expo Go
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // When the module is react-native-google-mobile-ads, provide mock
    if (moduleName === 'react-native-google-mobile-ads' || 
        moduleName.startsWith('react-native-google-mobile-ads/')) {
      return {
        filePath: require.resolve('./src/lib/adsMock.js'),
        type: 'sourceFile',
      };
    }

    // Use default resolution for all other modules
    if (originalResolver) {
      return originalResolver(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
} else {
  console.log('[Metro] Running in development/production build mode - using real ads SDK');
}

module.exports = config;
