import React, { useState } from "react";
import { View, StyleSheet, Platform, Text } from "react-native";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

// Conditionally import to avoid crashes in Expo Go
let BannerAd: any = null;
let BannerAdSize: any = null;

try {
  const adsModule = require("react-native-google-mobile-ads");
  BannerAd = adsModule.BannerAd;
  BannerAdSize = adsModule.BannerAdSize;
} catch (e) {
  console.log("[BannerAd] react-native-google-mobile-ads not available");
}

interface BannerAdComponentProps {
  style?: object;
}

export function BannerAdComponent({ style }: BannerAdComponentProps) {
  const { shouldShowAds, bannerAdUnitId, isAdsInitialized } = useAds();
  const { isPremium } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  // Don't render anything if premium or on web
  if (isPremium || Platform.OS === "web") {
    return null;
  }

  // Don't show if ads shouldn't be displayed
  if (!shouldShowAds) {
    return null;
  }

  // Native ads module not available (Expo Go) - show placeholder
  if (!BannerAd || !isAdsInitialized) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {!BannerAd ? "Ads require development build" : "Loading ad..."}
          </Text>
        </View>
      </View>
    );
  }

  // Show real ad
  if (adError) {
    return null; // Hide on error
  }

  return (
    <View style={[styles.container, style]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  placeholder: {
    width: 320,
    height: 50,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 11,
    color: "#d1d5db",
  },
});
