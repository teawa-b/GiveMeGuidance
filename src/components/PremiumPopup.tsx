import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePremium, PremiumPackage } from "../lib/PremiumContext";
import { lightHaptic, successHaptic } from "../lib/haptics";

// App logo
const appLogo = require("../../assets/mascot/bird-reading.png");

interface PremiumPopupProps {
  visible: boolean;
  onClose: () => void;
  useRevenueCatPaywall?: boolean; // If true, use RevenueCat's built-in paywall
}

export function PremiumPopup({ 
  visible, 
  onClose, 
  useRevenueCatPaywall = true // Default to RevenueCat paywall
}: PremiumPopupProps) {
  const { 
    packages, 
    purchasePackage, 
    restorePurchases, 
    isPremium,
    presentPaywall,
    isLoading,
  } = usePremium();
  
  const [selectedPackage, setSelectedPackage] = useState<PremiumPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check if we should use RevenueCat's native paywall
  const shouldUseNativePaywall = useRevenueCatPaywall && Platform.OS !== "web";

  // Use RevenueCat's native paywall
  useEffect(() => {
    if (visible && shouldUseNativePaywall) {
      // Present RevenueCat's paywall and close our modal
      const showPaywall = async () => {
        const purchased = await presentPaywall();
        if (purchased) {
          successHaptic();
        }
        onClose();
      };
      showPaywall();
    }
  }, [visible, shouldUseNativePaywall, presentPaywall, onClose]);

  // Animation setup for custom popup
  useEffect(() => {
    // Only animate if not using native paywall
    if (shouldUseNativePaywall) return;
    
    if (visible) {
      // Default to yearly (better value)
      const yearlyPackage = packages.find(p => p.period === "yearly");
      const lifetimePackage = packages.find(p => p.period === "lifetime");
      setSelectedPackage(yearlyPackage || lifetimePackage || packages[0] || null);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, packages, shouldUseNativePaywall]);

  // All hooks have been called - now we can do early returns
  // Don't show if already premium
  if (isPremium) return null;
  
  // If using RevenueCat paywall on native, don't render our custom UI
  if (shouldUseNativePaywall && visible) {
    return null;
  }

  const handlePurchase = async () => {
    if (!selectedPackage || isPurchasing) return;
    
    lightHaptic();
    setIsPurchasing(true);
    
    try {
      const success = await purchasePackage(selectedPackage);
      if (success) {
        successHaptic();
        onClose();
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    
    lightHaptic();
    setIsRestoring(true);
    
    try {
      const success = await restorePurchases();
      if (success) {
        successHaptic();
        onClose();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    lightHaptic();
    onClose();
  };

  // Find packages by period
  const monthlyPackage = packages.find(p => p.period === "monthly");
  const yearlyPackage = packages.find(p => p.period === "yearly");
  const lifetimePackage = packages.find(p => p.period === "lifetime");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.backdrop} onPress={handleClose} />
        
        <Animated.View 
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#9ca3af" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Image source={appLogo} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Support Give Me Guidance</Text>
            <Text style={styles.subtitle}>
              Remove ads and help us continue providing spiritual guidance
            </Text>
          </View>

          {/* Benefits */}
          <View style={styles.benefits}>
            {[
              "Remove all advertisements",
              "Support continued development",
              "Priority feature requests",
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {/* Loading state */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>Loading options...</Text>
            </View>
          ) : packages.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#9ca3af" />
              <Text style={styles.loadingText}>
                {Platform.OS === "web" 
                  ? "In-app purchases are only available on iOS and Android"
                  : "Unable to load subscription options"}
              </Text>
            </View>
          ) : (
            <>
              {/* Package options */}
              <View style={styles.packagesContainer}>
                {monthlyPackage && (
                  <Pressable
                    style={[
                      styles.packageCard,
                      selectedPackage?.identifier === monthlyPackage.identifier && styles.packageCardSelected,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setSelectedPackage(monthlyPackage);
                    }}
                  >
                    <Text style={styles.packageTitle}>Monthly</Text>
                    <Text style={styles.packagePrice}>{monthlyPackage.priceString}</Text>
                    <Text style={styles.packagePeriod}>per month</Text>
                  </Pressable>
                )}

                {yearlyPackage && (
                  <Pressable
                    style={[
                      styles.packageCard,
                      selectedPackage?.identifier === yearlyPackage.identifier && styles.packageCardSelected,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setSelectedPackage(yearlyPackage);
                    }}
                  >
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>BEST VALUE</Text>
                    </View>
                    <Text style={styles.packageTitle}>Yearly</Text>
                    <Text style={styles.packagePrice}>{yearlyPackage.priceString}</Text>
                    <Text style={styles.packagePeriod}>per year</Text>
                  </Pressable>
                )}

                {lifetimePackage && (
                  <Pressable
                    style={[
                      styles.packageCard,
                      styles.packageCardLifetime,
                      selectedPackage?.identifier === lifetimePackage.identifier && styles.packageCardSelected,
                    ]}
                    onPress={() => {
                      lightHaptic();
                      setSelectedPackage(lifetimePackage);
                    }}
                  >
                    <View style={[styles.saveBadge, styles.lifetimeBadge]}>
                      <Text style={styles.saveBadgeText}>FOREVER</Text>
                    </View>
                    <Text style={styles.packageTitle}>Lifetime</Text>
                    <Text style={styles.packagePrice}>{lifetimePackage.priceString}</Text>
                    <Text style={styles.packagePeriod}>one-time</Text>
                  </Pressable>
                )}
              </View>

              {/* Purchase button */}
              <Pressable
                style={[styles.purchaseButton, (isPurchasing || !selectedPackage) && styles.purchaseButtonDisabled]}
                onPress={handlePurchase}
                disabled={isPurchasing || !selectedPackage}
              >
                <LinearGradient
                  colors={["#10b981", "#059669"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.purchaseGradient}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.purchaseButtonText}>
                      {selectedPackage?.period === "lifetime" ? "Purchase Now" : "Subscribe Now"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </>
          )}

          {/* Restore purchases */}
          <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring}>
            {isRestoring ? (
              <ActivityIndicator size="small" color="#6b7280" />
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </Pressable>

          {/* Terms */}
          <Text style={styles.terms}>
            {Platform.OS !== "web" 
              ? "Subscription automatically renews. Cancel anytime in App Store settings."
              : "Subscriptions are managed through the App Store on your device."}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    maxHeight: "85%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  benefits: {
    marginBottom: 24,
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: "#374151",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  packagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
    justifyContent: "center",
  },
  packageCard: {
    flex: 1,
    minWidth: 100,
    maxWidth: 140,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    alignItems: "center",
    position: "relative",
  },
  packageCardLifetime: {
    flex: 1,
    minWidth: "100%",
    maxWidth: "100%",
    marginTop: 4,
  },
  packageCardSelected: {
    borderColor: "#10b981",
    backgroundColor: "rgba(16, 185, 129, 0.05)",
  },
  saveBadge: {
    position: "absolute",
    top: -10,
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  lifetimeBadge: {
    backgroundColor: "#8b5cf6",
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  packageTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
    marginTop: 4,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  packagePeriod: {
    fontSize: 12,
    color: "#9ca3af",
  },
  purchaseButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  purchaseGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreText: {
    fontSize: 14,
    color: "#6b7280",
  },
  terms: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },
});
