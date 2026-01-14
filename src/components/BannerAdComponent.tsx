import React, { useState } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import Constants from "expo-constants";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

// Check if running in Expo Go (native modules don't work in Expo Go)
const isExpoGo = Constants.appOwnership === "expo";

// Conditionally import the native ads module
let BannerAd: any = null;
let BannerAdSize: any = { BANNER: "BANNER" };

if (!isExpoGo && Platform.OS !== "web") {
  try {
    const adsModule = require("react-native-google-mobile-ads");
    BannerAd = adsModule.BannerAd;
    BannerAdSize = adsModule.BannerAdSize;
  } catch (e) {
    console.log("[AdMob] BannerAd not available");
  }
}

interface BannerAdComponentProps {
  style?: object;
}

export function BannerAdComponent({ style }: BannerAdComponentProps) {
  const { shouldShowAds, bannerAdUnitId, isAdsInitialized } = useAds();
  const { isPremium } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't show ads for premium users, on web, in Expo Go, or if BannerAd is not available
  if (isPremium || Platform.OS === "web" || isExpoGo || !BannerAd) {
    return null;
  }

  if (!shouldShowAds) {
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
          onAdFailedToLoad={(error) => {
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
