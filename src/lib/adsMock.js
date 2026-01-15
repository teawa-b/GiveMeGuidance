/**
 * Mock for react-native-google-mobile-ads
 * 
 * This file provides a mock implementation of the Google Mobile Ads SDK
 * that won't crash in Expo Go. When running in a development build with
 * native modules, the real implementation will be used instead.
 * 
 * This mock is only used when Metro resolves the ads module in Expo Go.
 */

// Mock BannerAd component - renders nothing
export const BannerAd = () => null;

// Mock banner ad sizes
export const BannerAdSize = {
  BANNER: 'BANNER',
  FULL_BANNER: 'FULL_BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  INLINE_ADAPTIVE_BANNER: 'INLINE_ADAPTIVE_BANNER',
  WIDE_SKYSCRAPER: 'WIDE_SKYSCRAPER',
};

// Mock ad event types
export const AdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  OPENED: 'opened',
  CLOSED: 'closed',
  CLICKED: 'clicked',
  IMPRESSION: 'impression',
};

// Mock rewarded ad event types
export const RewardedAdEventType = {
  LOADED: 'loaded',
  ERROR: 'error',
  EARNED_REWARD: 'earned_reward',
  OPENED: 'opened',
  CLOSED: 'closed',
};

// Mock InterstitialAd class
export const InterstitialAd = {
  createForAdRequest: () => ({
    load: () => {},
    show: () => Promise.resolve(),
    addAdEventListener: () => () => {},
    removeAllListeners: () => {},
  }),
};

// Mock RewardedAd class
export const RewardedAd = {
  createForAdRequest: () => ({
    load: () => {},
    show: () => Promise.resolve(),
    addAdEventListener: () => () => {},
    removeAllListeners: () => {},
  }),
};

// Mock MobileAds initialization
const mobileAds = () => ({
  initialize: () => {
    console.log('[GoogleMobileAds Mock] Initialized (mock - Expo Go mode)');
    return Promise.resolve([{ name: 'mock', status: 0 }]);
  },
  setRequestConfiguration: () => Promise.resolve(),
  openAdInspector: () => Promise.resolve(),
  openDebugMenu: () => {},
});

// Default export for MobileAds
export default mobileAds;

// Additional exports that might be used
export const MaxAdContentRating = {
  G: 'G',
  MA: 'MA',
  PG: 'PG',
  T: 'T',
  UNSPECIFIED: '',
};

export const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  INTERSTITIAL_VIDEO: 'ca-app-pub-3940256099942544/8691691433',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/5354046379',
  NATIVE: 'ca-app-pub-3940256099942544/2247696110',
  APP_OPEN: 'ca-app-pub-3940256099942544/3419835294',
};

// Re-export everything as named exports
module.exports = {
  default: mobileAds,
  BannerAd,
  BannerAdSize,
  AdEventType,
  RewardedAdEventType,
  InterstitialAd,
  RewardedAd,
  MaxAdContentRating,
  TestIds,
};
