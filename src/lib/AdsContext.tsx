import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Platform } from "react-native";
import mobileAds, { MaxAdContentRating } from "react-native-google-mobile-ads";
import { usePremium } from "./PremiumContext";

// ============================================================================
// PRODUCTION AD UNIT IDs - Give Me Guidance
// ============================================================================

const AD_UNIT_IDS = {
  banner: {
    ios: "ca-app-pub-7517928309502563/9718522937",      // iOS Home Banner
    android: "ca-app-pub-7517928309502563/2825811525",  // Android Home Banner
  },
  native: {
    ios: "ca-app-pub-7517928309502563/2039343464",      // iOS Loading Native Ad
    android: "ca-app-pub-7517928309502563/1010182889",  // Android Loading Native Ad
  },
};

// Test Ad Unit IDs (for development - switch to these if you need to test)
const TEST_AD_UNIT_IDS = {
  banner: {
    ios: "ca-app-pub-3940256099942544/2934735716",
    android: "ca-app-pub-3940256099942544/6300978111",
  },
  native: {
    ios: "ca-app-pub-3940256099942544/3986624511",
    android: "ca-app-pub-3940256099942544/2247696110",
  },
};

// Set to true to use test ads during development
const USE_TEST_ADS = __DEV__;

// Get the appropriate ad unit IDs
const getAdUnitIds = () => {
  return USE_TEST_ADS ? TEST_AD_UNIT_IDS : AD_UNIT_IDS;
};

interface AdsContextType {
  isAdsInitialized: boolean;
  shouldShowAds: boolean;
  bannerAdUnitId: string;
  nativeAdUnitId: string;
  initializeAds: () => Promise<void>;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isPremium } = usePremium();
  const [isAdsInitialized, setIsAdsInitialized] = useState(false);

  const adIds = getAdUnitIds();

  // Get appropriate ad unit ID based on platform
  const bannerAdUnitId = Platform.select({
    ios: adIds.banner.ios,
    android: adIds.banner.android,
    default: adIds.banner.android,
  }) as string;

  const nativeAdUnitId = Platform.select({
    ios: adIds.native.ios,
    android: adIds.native.android,
    default: adIds.native.android,
  }) as string;

  // Initialize Google Mobile Ads
  const initializeAds = useCallback(async () => {
    if (Platform.OS === "web") {
      console.log("[AdMob] Ads not supported on web");
      return;
    }

    if (isAdsInitialized) {
      console.log("[AdMob] Already initialized");
      return;
    }

    try {
      // Configure ad request settings
      await mobileAds().setRequestConfiguration({
        // Maximum ad content rating (G = General audiences)
        maxAdContentRating: MaxAdContentRating.G,
        // For COPPA compliance - set to true if your app is directed at children
        tagForChildDirectedTreatment: false,
        // For users under age of consent in EEA
        tagForUnderAgeOfConsent: false,
        // Test device IDs for development (optional)
        testDeviceIdentifiers: __DEV__ ? ["EMULATOR"] : [],
      });

      // Initialize the SDK
      const adapterStatuses = await mobileAds().initialize();
      
      console.log("[AdMob] Initialization complete!");
      console.log("[AdMob] Adapter statuses:", JSON.stringify(adapterStatuses, null, 2));
      console.log("[AdMob] Using", USE_TEST_ADS ? "TEST" : "PRODUCTION", "ad unit IDs");
      
      setIsAdsInitialized(true);
    } catch (error) {
      console.error("[AdMob] Failed to initialize:", error);
    }
  }, [isAdsInitialized]);

  // Whether to show ads (false if premium or on web)
  const shouldShowAds = !isPremium && Platform.OS !== "web";

  // Initialize on mount
  useEffect(() => {
    initializeAds();
  }, [initializeAds]);

  return (
    <AdsContext.Provider
      value={{
        isAdsInitialized,
        shouldShowAds,
        bannerAdUnitId,
        nativeAdUnitId,
        initializeAds,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
}

export function useAds() {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error("useAds must be used within an AdsProvider");
  }
  return context;
}
