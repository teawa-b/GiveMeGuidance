import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Platform, Alert, AppState, AppStateStatus, InteractionManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Purchases, { 
  PurchasesPackage, 
  CustomerInfo, 
  PurchasesOffering,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import { useAuth } from "./AuthContext";

// RevenueCat API Key - Use production key for iOS (starts with appl_)
// Get from RevenueCat Dashboard > Your App > API Keys > Public iOS API key
const REVENUECAT_API_KEY = "appl_YOUR_PRODUCTION_KEY_HERE"; // TODO: Replace with your actual production key

// Entitlement identifier - must match what's configured in RevenueCat dashboard
const ENTITLEMENT_ID = "Support Guidance";

// Storage keys for popup logic
const LAST_POPUP_DATE_KEY = "last_premium_popup_date";
const APP_OPEN_COUNT_KEY = "app_open_count";

// Package types
export type PackagePeriod = "monthly" | "yearly" | "lifetime";

export interface PremiumPackage {
  identifier: string;
  title: string;
  description: string;
  priceString: string;
  period: PackagePeriod;
  rcPackage: PurchasesPackage; // Keep reference to original RC package
}

interface PremiumContextType {
  // State
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  packages: PremiumPackage[];
  
  // Actions
  purchasePackage: (pkg: PremiumPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkPremiumStatus: () => Promise<void>;
  
  // Paywall
  presentPaywall: () => Promise<boolean>;
  presentPaywallIfNeeded: () => Promise<boolean>;
  
  // Customer Center
  presentCustomerCenter: () => Promise<void>;
  
  // Popup logic
  shouldShowPopup: () => Promise<boolean>;
  markPopupShown: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [packages, setPackages] = useState<PremiumPackage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user has active entitlement
  const checkEntitlement = useCallback((info: CustomerInfo): boolean => {
    const entitlement = info.entitlements.active[ENTITLEMENT_ID];
    return entitlement !== undefined && entitlement.isActive;
  }, []);

  // Initialize RevenueCat
  const initializeRevenueCat = useCallback(async () => {
    if (Platform.OS === "web") {
      console.log("[RevenueCat] Not supported on web");
      setIsLoading(false);
      return;
    }

    try {
      // Wait for interactions to complete to ensure React Native is fully initialized
      // This prevents crashes during early app startup
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(() => {
          resolve();
        });
      });
      
      // Additional safety delay for native modules to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure RevenueCat
      await Purchases.configure({ 
        apiKey: REVENUECAT_API_KEY,
        appUserID: user?.id || undefined, // Will use anonymous ID if not provided
      });

      console.log("[RevenueCat] Configured successfully");
      setIsInitialized(true);

      // Set up customer info listener for real-time updates
      Purchases.addCustomerInfoUpdateListener((info) => {
        console.log("[RevenueCat] Customer info updated");
        setCustomerInfo(info);
        setIsPremium(checkEntitlement(info));
      });

    } catch (error) {
      console.error("[RevenueCat] Failed to initialize:", error);
      setIsLoading(false);
    }
  }, [user?.id, checkEntitlement]);

  // Log in user when they authenticate
  const loginUser = useCallback(async (userId: string) => {
    if (Platform.OS === "web" || !isInitialized) return;

    try {
      const { customerInfo: info } = await Purchases.logIn(userId);
      console.log("[RevenueCat] User logged in:", userId);
      setCustomerInfo(info);
      setIsPremium(checkEntitlement(info));
    } catch (error) {
      console.error("[RevenueCat] Login error:", error);
    }
  }, [isInitialized, checkEntitlement]);

  // Log out user
  const logoutUser = useCallback(async () => {
    if (Platform.OS === "web" || !isInitialized) return;

    try {
      const info = await Purchases.logOut();
      console.log("[RevenueCat] User logged out");
      setCustomerInfo(info);
      setIsPremium(checkEntitlement(info));
    } catch (error) {
      console.error("[RevenueCat] Logout error:", error);
    }
  }, [isInitialized, checkEntitlement]);

  // Check premium status
  const checkPremiumStatus = useCallback(async () => {
    if (Platform.OS === "web") {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      setIsPremium(checkEntitlement(info));
      console.log("[RevenueCat] Premium status:", checkEntitlement(info));
    } catch (error) {
      console.error("[RevenueCat] Error checking status:", error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, [checkEntitlement]);

  // Fetch available offerings and packages
  const fetchOfferings = useCallback(async () => {
    if (Platform.OS === "web") return;

    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current) {
        setCurrentOffering(offerings.current);
        
        // Map packages to our format
        const mappedPackages: PremiumPackage[] = offerings.current.availablePackages.map((pkg) => {
          let period: PackagePeriod = "monthly";
          
          // Determine period based on package type
          if (pkg.packageType === "MONTHLY") {
            period = "monthly";
          } else if (pkg.packageType === "ANNUAL") {
            period = "yearly";
          } else if (pkg.packageType === "LIFETIME") {
            period = "lifetime";
          } else if (pkg.identifier.toLowerCase().includes("lifetime")) {
            period = "lifetime";
          } else if (pkg.identifier.toLowerCase().includes("year")) {
            period = "yearly";
          }

          return {
            identifier: pkg.identifier,
            title: pkg.product.title,
            description: pkg.product.description,
            priceString: pkg.product.priceString,
            period,
            rcPackage: pkg,
          };
        });

        setPackages(mappedPackages);
        console.log("[RevenueCat] Loaded", mappedPackages.length, "packages");
      }
    } catch (error) {
      console.error("[RevenueCat] Error fetching offerings:", error);
    }
  }, []);

  // Purchase a package
  const purchasePackage = useCallback(async (pkg: PremiumPackage): Promise<boolean> => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "In-app purchases are only available on iOS and Android.",
        [{ text: "OK" }]
      );
      return false;
    }

    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg.rcPackage);
      setCustomerInfo(info);
      
      const hasEntitlement = checkEntitlement(info);
      setIsPremium(hasEntitlement);
      
      if (hasEntitlement) {
        console.log("[RevenueCat] Purchase successful!");
        return true;
      }
      
      return false;
    } catch (error: any) {
      if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        console.log("[RevenueCat] Purchase cancelled by user");
        return false;
      }
      
      console.error("[RevenueCat] Purchase error:", error);
      
      // Show user-friendly error message
      let message = "Something went wrong. Please try again.";
      
      if (error.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        message = "Your purchase is pending. It will be activated once payment is confirmed.";
      } else if (error.code === PURCHASES_ERROR_CODE.PRODUCT_NOT_AVAILABLE_FOR_PURCHASE_ERROR) {
        message = "This product is not available for purchase at this time.";
      } else if (error.code === PURCHASES_ERROR_CODE.PURCHASE_NOT_ALLOWED_ERROR) {
        message = "Purchases are not allowed on this device.";
      } else if (error.code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
        message = "Network error. Please check your connection and try again.";
      }
      
      Alert.alert("Purchase Failed", message, [{ text: "OK" }]);
      return false;
    }
  }, [checkEntitlement]);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Restore purchases is only available on iOS and Android.",
        [{ text: "OK" }]
      );
      return false;
    }

    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      
      const hasEntitlement = checkEntitlement(info);
      setIsPremium(hasEntitlement);
      
      if (hasEntitlement) {
        Alert.alert("Success", "Your purchases have been restored!", [{ text: "OK" }]);
        return true;
      } else {
        Alert.alert(
          "No Purchases Found",
          "We couldn't find any previous purchases to restore.",
          [{ text: "OK" }]
        );
        return false;
      }
    } catch (error) {
      console.error("[RevenueCat] Restore error:", error);
      Alert.alert(
        "Restore Failed",
        "Unable to restore purchases. Please try again later.",
        [{ text: "OK" }]
      );
      return false;
    }
  }, [checkEntitlement]);

  // Present the RevenueCat Paywall
  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Paywall is only available on iOS and Android.",
        [{ text: "OK" }]
      );
      return false;
    }

    try {
      const paywallResult = await RevenueCatUI.presentPaywall();
      
      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          // Refresh customer info after purchase/restore
          await checkPremiumStatus();
          return true;
        case PAYWALL_RESULT.NOT_PRESENTED:
          console.log("[RevenueCat] Paywall not presented");
          return false;
        case PAYWALL_RESULT.ERROR:
          console.error("[RevenueCat] Paywall error");
          return false;
        case PAYWALL_RESULT.CANCELLED:
          console.log("[RevenueCat] Paywall cancelled");
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error("[RevenueCat] Error presenting paywall:", error);
      return false;
    }
  }, [checkPremiumStatus]);

  // Present paywall only if user doesn't have entitlement
  const presentPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;

    try {
      const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_ID,
      });
      
      if (paywallResult === PAYWALL_RESULT.PURCHASED || paywallResult === PAYWALL_RESULT.RESTORED) {
        await checkPremiumStatus();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("[RevenueCat] Error presenting paywall if needed:", error);
      return false;
    }
  }, [checkPremiumStatus]);

  // Present Customer Center for subscription management
  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Not Available",
        "Subscription management is only available on iOS and Android.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.error("[RevenueCat] Error presenting customer center:", error);
      Alert.alert(
        "Error",
        "Unable to open subscription management. Please try again.",
        [{ text: "OK" }]
      );
    }
  }, []);

  // Check if we should show the premium popup
  const shouldShowPopup = useCallback(async (): Promise<boolean> => {
    if (isPremium) return false;
    if (Platform.OS === "web") return false;
    
    try {
      // Check app open count (show after 7 opens)
      const countStr = await AsyncStorage.getItem(APP_OPEN_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      
      if (count < 7) {
        await AsyncStorage.setItem(APP_OPEN_COUNT_KEY, String(count + 1));
        return false;
      }
      
      // Check last popup date (max once per week)
      const lastPopupDate = await AsyncStorage.getItem(LAST_POPUP_DATE_KEY);
      if (lastPopupDate) {
        const daysSince = Math.floor(
          (Date.now() - new Date(lastPopupDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince < 7) return false;
      }
      
      return true;
    } catch (error) {
      console.error("[RevenueCat] Error checking popup:", error);
      return false;
    }
  }, [isPremium]);

  // Mark popup as shown
  const markPopupShown = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_POPUP_DATE_KEY, new Date().toISOString());
    } catch (error) {
      console.error("[RevenueCat] Error marking popup shown:", error);
    }
  }, []);

  // Handle app state changes (refresh on foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isInitialized) {
        // Refresh customer info when app comes to foreground
        checkPremiumStatus();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [isInitialized, checkPremiumStatus]);

  // Initialize on mount
  useEffect(() => {
    initializeRevenueCat();
  }, [initializeRevenueCat]);

  // Fetch offerings after initialization
  useEffect(() => {
    if (isInitialized) {
      checkPremiumStatus();
      fetchOfferings();
    }
  }, [isInitialized, checkPremiumStatus, fetchOfferings]);

  // Handle user authentication changes
  useEffect(() => {
    if (isInitialized) {
      if (user?.id) {
        loginUser(user.id);
      } else {
        logoutUser();
      }
    }
  }, [user?.id, isInitialized, loginUser, logoutUser]);

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading,
        customerInfo,
        currentOffering,
        packages,
        purchasePackage,
        restorePurchases,
        checkPremiumStatus,
        presentPaywall,
        presentPaywallIfNeeded,
        presentCustomerCenter,
        shouldShowPopup,
        markPopupShown,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
}

// Helper hook for checking specific entitlements
export function useEntitlement(entitlementId: string = ENTITLEMENT_ID): boolean {
  const { customerInfo } = usePremium();
  
  if (!customerInfo) return false;
  
  const entitlement = customerInfo.entitlements.active[entitlementId];
  return entitlement !== undefined && entitlement.isActive;
}
