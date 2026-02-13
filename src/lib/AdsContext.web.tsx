import React, { createContext, useContext, ReactNode } from "react";

// Web-only stub for AdsContext - ads are not supported on web

interface AdsContextType {
  isAdsInitialized: boolean;
  shouldShowAds: boolean;
  bannerAdUnitId: string;
  interstitialAdUnitId: string;
  rewardedAdUnitId: string;
  nativeAdUnitId: string;
  BannerAd: any;
  BannerAdSize: any;
  showInterstitialAd: () => Promise<boolean>;
  showRewardedAd: () => Promise<boolean>;
  maybeShowInterstitialAd: (probability?: number) => Promise<boolean>;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

export function AdsProvider({ children }: { children: ReactNode }) {
  const value: AdsContextType = {
    isAdsInitialized: false,
    shouldShowAds: false,
    bannerAdUnitId: "",
    interstitialAdUnitId: "",
    rewardedAdUnitId: "",
    nativeAdUnitId: "",
    BannerAd: null,
    BannerAdSize: null,
    showInterstitialAd: async () => false,
    showRewardedAd: async () => false,
    maybeShowInterstitialAd: async () => false,
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

