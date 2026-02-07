import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Text, Dimensions } from "react-native";
import Constants from "expo-constants";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

// Check if running in Expo Go (where native modules aren't available)
const isExpoGo = Constants.appOwnership === "expo";

// Get screen width for adaptive banner
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_RETRIES = 3;

interface BannerAdComponentProps {
  style?: object;
}

export function BannerAdComponent({ style }: BannerAdComponentProps) {
  const { shouldShowAds, bannerAdUnitId, isAdsInitialized, BannerAd, BannerAdSize } = useAds();
  const { isPremium } = usePremium();
  const [adLoaded, setAdLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [adRequestKey, setAdRequestKey] = useState(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Log initialization state
  useEffect(() => {
    console.log("[BannerAd] Component mounted", {
      isPremium,
      shouldShowAds,
      isAdsInitialized,
      hasBannerAd: !!BannerAd,
      bannerAdUnitId,
      platform: Platform.OS,
    });
  }, [isPremium, shouldShowAds, isAdsInitialized, BannerAd, bannerAdUnitId]);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // Don't render anything if premium, on web, or in Expo Go
  if (isPremium || Platform.OS === "web" || isExpoGo) {
    return null;
  }

  // Don't show if ads shouldn't be displayed
  if (!shouldShowAds) {
    console.log("[BannerAd] shouldShowAds is false");
    return null;
  }

  if (!bannerAdUnitId) {
    console.log("[BannerAd] Missing banner ad unit ID");
    return null;
  }

  // Native ads module not available - show placeholder
  if (!BannerAd || !isAdsInitialized) {
    console.log("[BannerAd] Waiting for initialization...", { BannerAd: !!BannerAd, isAdsInitialized });
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {!isAdsInitialized ? "Initializing ads..." : "Loading ad..."}
          </Text>
        </View>
      </View>
    );
  }

  // Avoid leaving permanent empty ad gaps when no-fill persists on a device.
  if (!adLoaded && retryCount >= MAX_RETRIES) {
    console.log("[BannerAd] Max retries reached, hiding banner for this session");
    return null;
  }

  const bannerSize =
    Platform.OS === "ios"
      ? (BannerAdSize.BANNER || BannerAdSize.ANCHORED_ADAPTIVE_BANNER)
      : (BannerAdSize.ANCHORED_ADAPTIVE_BANNER || BannerAdSize.BANNER);

  return (
    <View style={[styles.container, style, !adLoaded && styles.loading]}>
      <BannerAd
        key={`${bannerAdUnitId}-${adRequestKey}`}
        unitId={bannerAdUnitId}
        size={bannerSize}
        requestOptions={{}}
        onAdLoaded={() => {
          console.log("[BannerAd] Ad loaded successfully");
          setAdLoaded(true);
          setRetryCount(0);
        }}
        onAdFailedToLoad={(error: any) => {
          console.log("[BannerAd] Ad failed to load:", {
            code: error?.code,
            message: error?.message,
            domain: error?.domain,
            retryCount,
          });
          setAdLoaded(false);
          setRetryCount((prev) => {
            const next = prev + 1;
            const retryDelayMs = Math.min(30000, 2000 * next);
            if (retryTimerRef.current) {
              clearTimeout(retryTimerRef.current);
            }
            retryTimerRef.current = setTimeout(() => {
              setAdRequestKey((k) => k + 1);
            }, retryDelayMs);
            return next;
          });
        }}
        onAdOpened={() => {
          console.log("[BannerAd] Ad opened");
        }}
        onAdClosed={() => {
          console.log("[BannerAd] Ad closed");
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
    maxWidth: Math.max(320, SCREEN_WIDTH),
    width: "100%",
  },
  loading: {
    opacity: 0.5,
  },
  placeholder: {
    width: "100%",
    maxWidth: 320,
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
