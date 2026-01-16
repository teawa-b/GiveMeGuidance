const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to set up Firebase for iOS:
 * 1. Copies GoogleService-Info.plist to the iOS project
 * 2. Adds modular headers for Firebase Swift pods
 */
function withFirebaseIOS(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformRoot = config.modRequest.platformProjectRoot;
      
      // 1. Copy GoogleService-Info.plist
      const sourcePlist = path.join(projectRoot, 'GoogleService-Info.plist');
      const destPlist = path.join(platformRoot, 'GoogleService-Info.plist');
      
      if (fs.existsSync(sourcePlist)) {
        fs.copyFileSync(sourcePlist, destPlist);
        console.log('[withFirebaseIOS] Copied GoogleService-Info.plist to ios/');
      } else {
        console.warn('[withFirebaseIOS] GoogleService-Info.plist not found in project root');
      }
      
      // 2. Add modular headers to Podfile
      const podfilePath = path.join(platformRoot, 'Podfile');
      
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
            console.log('[withFirebaseIOS] Added modular headers for Firebase dependencies');
          } else {
            console.log('[withFirebaseIOS] Could not find platform declaration in Podfile');
          }
        } else {
          console.log('[withFirebaseIOS] Modular headers already added');
        }
      } else {
        console.log('[withFirebaseIOS] Podfile not found (will be created by prebuild)');
      }
      
      return config;
    },
  ]);
}

module.exports = withFirebaseIOS;
