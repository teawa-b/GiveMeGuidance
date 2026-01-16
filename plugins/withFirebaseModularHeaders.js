const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add modular headers for Firebase dependencies
 * This fixes the Swift pods integration issue with static libraries
 */
function withFirebaseModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf8');
        
        // Check if we already added the modular headers
        if (!podfileContent.includes('# Enable modular headers for Firebase')) {
          // Add pod-specific modular headers after platform declaration
          const platformRegex = /(platform :ios.*)/;
          
          const modularHeadersCode = `$1

# Enable modular headers for Firebase Swift pods
pod 'GoogleUtilities', :modular_headers => true
pod 'GoogleDataTransport', :modular_headers => true
pod 'nanopb', :modular_headers => true
`;
          
          if (platformRegex.test(podfileContent)) {
            podfileContent = podfileContent.replace(platformRegex, modularHeadersCode);
            fs.writeFileSync(podfilePath, podfileContent);
            console.log('[withFirebaseModularHeaders] Added modular headers for Firebase dependencies');
          } else {
            console.log('[withFirebaseModularHeaders] Could not find platform declaration in Podfile');
          }
        } else {
          console.log('[withFirebaseModularHeaders] Modular headers already added');
        }
      } else {
        console.log('[withFirebaseModularHeaders] Podfile not found');
      }
      
      return config;
    },
  ]);
}

module.exports = withFirebaseModularHeaders;
