import React, { useState, useEffect } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import Constants from "expo-constants";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

interface BannerAdComponentProps {
  style?: object;
}

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

// Dynamically import BannerAd only if not in Expo Go
let BannerAd: any = null;
let BannerAdSize: any = null;

if (!isExpoGo && Platform.OS !== "web") {
  try {
    const ads = require("react-native-google-mobile-ads");
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
  } catch (e) {
    console.log("[AdMob] Failed to load native module:", e);
  }
}

export function BannerAdComponent({ style }: BannerAdComponentProps) {
  const { shouldShowAds, bannerAdUnitId, isAdsInitialized } = useAds();
  const { isPremium } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't render anything if premium, on web, or in Expo Go
  if (isPremium || Platform.OS === "web" || isExpoGo) {
    return null;
  }

  // Don't show if ads shouldn't be displayed or native module not available
  if (!shouldShowAds || !BannerAd) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {isAdsInitialized && !adError ? (
        <BannerAd
          unitId={bannerAdUnitId}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            console.log("[AdMob] Banner ad loaded");
            setAdLoaded(true);
          }}
          onAdFailedToLoad={(error: any) => {
            console.log("[AdMob] Banner ad failed to load:", error);
            setAdError(true);
          }}
        />
      ) : adError ? null : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Loading ad...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  placeholder: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    width: "100%",
  },
  placeholderText: {
    color: "#999",
    fontSize: 12,
  },
});
