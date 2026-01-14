import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, Text, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useAds } from "../lib/AdsContext";
import { usePremium } from "../lib/PremiumContext";

interface NativeAdLoadingProps {
  isVisible: boolean;
  loadingMessage?: string;
}

export function NativeAdLoading({ isVisible, loadingMessage = "Finding guidance..." }: NativeAdLoadingProps) {
  const { shouldShowAds, nativeAdUnitId, isAdsInitialized } = useAds();
  const { isPremium } = usePremium();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Subtle pulse animation for the loading indicator
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  // Don't render if premium or not visible
  if (isPremium || !isVisible || Platform.OS === "web") {
    // Still show loading without ad for premium/web
    if (isVisible) {
      return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.loadingSection}>
            <Animated.View style={{ opacity: pulseAnim }}>
              <Ionicons name="book-outline" size={32} color="#10b981" />
            </Animated.View>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        </Animated.View>
      );
    }
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Loading indicator */}
      <View style={styles.loadingSection}>
        <Animated.View style={{ opacity: pulseAnim }}>
          <Ionicons name="book-outline" size={32} color="#10b981" />
        </Animated.View>
        <Text style={styles.loadingText}>{loadingMessage}</Text>
      </View>

      {/* Native-style ad using Medium Rectangle format during loading */}
      {shouldShowAds && isAdsInitialized && !adError && (
        <View style={styles.adContainer}>
          <Text style={styles.adLabel}>Sponsored</Text>
          <BannerAd
            unitId={nativeAdUnitId}
            size={BannerAdSize.MEDIUM_RECTANGLE}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
            onAdLoaded={() => {
              console.log("[AdMob] Native loading ad loaded");
              setAdLoaded(true);
            }}
            onAdFailedToLoad={(error) => {
              console.log("[AdMob] Native loading ad failed:", error);
              setAdError(true);
            }}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  loadingSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  adContainer: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  adLabel: {
    fontSize: 10,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
});
