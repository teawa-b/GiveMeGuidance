import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Platform, InteractionManager } from "react-native";
import Constants from "expo-constants";

// Only import tracking transparency on native platforms with error handling
let requestTrackingPermissionsAsync = async () => ({ status: "denied" as const });

if (Platform.OS !== "web") {
  try {
    const trackingModule = require("expo-tracking-transparency");
    requestTrackingPermissionsAsync = trackingModule.requestTrackingPermissionsAsync;
  } catch (e) {
    console.warn("expo-tracking-transparency not available:", e);
  }
}

// Check if running in Expo Go (where native modules aren't available)
const isExpoGo = Constants.appOwnership === "expo";

// Ad Unit IDs - Replace with your actual ad unit IDs from AdMob
const TEST_BANNER_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-3940256099942544/2934735716",
  android: "ca-app-pub-3940256099942544/6300978111",
  default: "",
});

const TEST_INTERSTITIAL_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-3940256099942544/4411468910",
  android: "ca-app-pub-3940256099942544/1033173712",
  default: "",
});

const TEST_REWARDED_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-3940256099942544/1712485313",
  android: "ca-app-pub-3940256099942544/5224354917",
  default: "",
});

const TEST_NATIVE_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-3940256099942544/3986624511",
  android: "ca-app-pub-3940256099942544/2247696110",
  default: "",
});

// Production Ad Unit IDs
const PRODUCTION_BANNER_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-7517928309502563/9718522937", // Home Banner iOS
  android: "ca-app-pub-7517928309502563/2825811525", // Home Banner Android
  default: "",
});

const PRODUCTION_NATIVE_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-7517928309502563/2039343464", // Loading Native Ad iOS
  android: "ca-app-pub-7517928309502563/1010182889", // Loading Native Ad Android
  default: "",
});

const PRODUCTION_INTERSTITIAL_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-7517928309502563/1832325875", // Interstitial iOS
  android: "ca-app-pub-7517928309502563/5627907139", // Interstitial Android
  default: "",
});

const PRODUCTION_REWARDED_AD_UNIT_ID = Platform.select({
  ios: "ca-app-pub-7517928309502563/9718522937", // Using banner as placeholder - create rewarded ad unit if needed
  android: "ca-app-pub-7517928309502563/2825811525", // Using banner as placeholder - create rewarded ad unit if needed
  default: "",
});

// Use test ads in development
// Optional override for release/dev-client builds:
// set EXPO_PUBLIC_FORCE_TEST_ADS=1 to force Google test ad units.
const FORCE_TEST_ADS = process.env.EXPO_PUBLIC_FORCE_TEST_ADS === "1";
const USE_TEST_ADS = __DEV__ || FORCE_TEST_ADS;

const ENV_BANNER_AD_UNIT_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_AD_UNIT_ID,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_AD_UNIT_ID,
  default: "",
});

const ENV_NATIVE_AD_UNIT_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_NATIVE_AD_UNIT_ID,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_NATIVE_AD_UNIT_ID,
  default: "",
});

const ENV_INTERSTITIAL_AD_UNIT_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_INTERSTITIAL_AD_UNIT_ID,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_INTERSTITIAL_AD_UNIT_ID,
  default: "",
});

const ENV_REWARDED_AD_UNIT_ID = Platform.select({
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_AD_UNIT_ID,
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_AD_UNIT_ID,
  default: "",
});

interface AdsContextType {
  // State
  isAdsInitialized: boolean;
  shouldShowAds: boolean;
  
  // Ad Unit IDs
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  rewardedAdUnitId: string;
  nativeAdUnitId: string;
  
  // Ad Components (loaded dynamically)
  BannerAd: any;
  BannerAdSize: any;
  
  // Actions
  showInterstitialAd: () => Promise<boolean>;
  showRewardedAd: () => Promise<boolean>;
  // Shows an interstitial ad with a probability (e.g., 1 in 4 times = 0.25)
  maybeShowInterstitialAd: (probability?: number) => Promise<boolean>;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export function AdsProvider({ children }: { children: ReactNode }) {
  const [isAdsInitialized, setIsAdsInitialized] = useState(false);
  const [shouldShowAds, setShouldShowAds] = useState(!isExpoGo && Platform.OS !== "web");
  const [adsModule, setAdsModule] = useState<any>(null);

  // Get the appropriate ad unit IDs
  const bannerAdUnitId = USE_TEST_ADS
    ? TEST_BANNER_AD_UNIT_ID
    : ENV_BANNER_AD_UNIT_ID || PRODUCTION_BANNER_AD_UNIT_ID;
  const interstitialAdUnitId = USE_TEST_ADS
    ? TEST_INTERSTITIAL_AD_UNIT_ID
    : ENV_INTERSTITIAL_AD_UNIT_ID || PRODUCTION_INTERSTITIAL_AD_UNIT_ID;
  const rewardedAdUnitId = USE_TEST_ADS
    ? TEST_REWARDED_AD_UNIT_ID
    : ENV_REWARDED_AD_UNIT_ID || PRODUCTION_REWARDED_AD_UNIT_ID;
  const nativeAdUnitId = USE_TEST_ADS
    ? TEST_NATIVE_AD_UNIT_ID
    : ENV_NATIVE_AD_UNIT_ID || PRODUCTION_NATIVE_AD_UNIT_ID;

  // Initialize Google Mobile Ads
  useEffect(() => {
    const initializeAds = async () => {
      // Skip ads in Expo Go or on web
      if (isExpoGo) {
        console.log("[Ads] Running in Expo Go - ads disabled");
        setShouldShowAds(false);
        return;
      }

      if (Platform.OS === "web") {
        console.log("[Ads] Not supported on web");
        setShouldShowAds(false);
        return;
      }

      // Wait for React Native interactions to complete before initializing native modules
      // This prevents crashes during early app startup when native modules aren't ready
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          resolve();
        });
      });

      // Small delay to ensure the app is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // Request App Tracking Transparency permission on iOS
        if (Platform.OS === "ios") {
          console.log("[Ads] Requesting tracking permission...");
          const { status } = await requestTrackingPermissionsAsync();
          console.log("[Ads] Tracking permission status:", status);
        }

        // Try to import and initialize the ads SDK
        console.log("[Ads] Importing Google Mobile Ads SDK...");
        const adsModuleImport = require("react-native-google-mobile-ads");
        const mobileAds = adsModuleImport.default;
        
        console.log("[Ads] Configuring request settings...");
        // Configure request settings before initialization
        await mobileAds().setRequestConfiguration({
          // Set to true for apps directed at children
          tagForChildDirectedTreatment: false,
          // Set to true to indicate that you want to treat ads as under age
          tagForUnderAgeOfConsent: false,
        });
        
        console.log("[Ads] Initializing Google Mobile Ads SDK...");
        const initStatus = await mobileAds().initialize();
        console.log("[Ads] Google Mobile Ads initialized successfully");
        console.log("[Ads] Adapter statuses:", JSON.stringify(initStatus));
        setAdsModule(adsModuleImport);
        setIsAdsInitialized(true);
      } catch (error) {
        console.log("[Ads] Failed to initialize Google Mobile Ads:", error);
        // Ads not available (likely in Expo Go)
        setShouldShowAds(false);
      }
    };

    initializeAds();
  }, []);

  // Show interstitial ad
  const showInterstitialAd = async (): Promise<boolean> => {
    if (!isAdsInitialized || Platform.OS === "web" || isExpoGo) {
      return false;
    }

    try {
      const { InterstitialAd, AdEventType } = require("react-native-google-mobile-ads");
      
      return new Promise((resolve) => {
        const interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);
        
        const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
          interstitial.show();
        });
        
        const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          unsubscribeLoaded();
          unsubscribeClosed();
          resolve(true);
        });
        
        const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
          unsubscribeLoaded();
          unsubscribeClosed();
          unsubscribeError();
          resolve(false);
        });
        
        interstitial.load();
      });
    } catch (error) {
      console.log("[Ads] Failed to show interstitial:", error);
      return false;
    }
  };

  // Show rewarded ad
  const showRewardedAd = async (): Promise<boolean> => {
    if (!isAdsInitialized || Platform.OS === "web" || isExpoGo) {
      return false;
    }

    try {
      const { RewardedAd, RewardedAdEventType } = require("react-native-google-mobile-ads");
      
      return new Promise((resolve) => {
        const rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId);
        
        const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
          rewarded.show();
        });
        
        const unsubscribeEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
          unsubscribeLoaded();
          unsubscribeEarned();
          resolve(true);
        });
        
        const unsubscribeError = rewarded.addAdEventListener(RewardedAdEventType.ERROR, () => {
          unsubscribeLoaded();
          unsubscribeEarned();
          unsubscribeError();
          resolve(false);
        });
        
        rewarded.load();
      });
    } catch (error) {
      console.log("[Ads] Failed to show rewarded ad:", error);
      return false;
    }
  };

  // Show interstitial ad with a probability (default: 1 in 4 times = 0.25)
  // Returns true if the ad was shown and closed, false otherwise
  const maybeShowInterstitialAd = async (probability: number = 0.25): Promise<boolean> => {
    // Random check - only show ad with the given probability
    if (Math.random() > probability) {
      console.log("[Ads] Skipping interstitial (random chance)");
      return false;
    }
    
    return showInterstitialAd();
  };

  const value: AdsContextType = {
    isAdsInitialized,
    shouldShowAds,
    bannerAdUnitId: bannerAdUnitId || "",
    interstitialAdUnitId: interstitialAdUnitId || "",
    rewardedAdUnitId: rewardedAdUnitId || "",
    nativeAdUnitId: nativeAdUnitId || "",
    BannerAd: adsModule?.BannerAd || null,
    BannerAdSize: adsModule?.BannerAdSize || null,
    showInterstitialAd,
    showRewardedAd,
    maybeShowInterstitialAd,
  };

  return <AdsContext.Provider value={value}>{children}</AdsContext.Provider>;
}

export function useAds(): AdsContextType {
  const context = useContext(AdsContext);
  if (context === undefined) {
    throw new Error("useAds must be used within an AdsProvider");
  }
  return context;
}
