import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Haptic feedback utility for improving user engagement
 * Provides various haptic patterns for different interaction types
 */

const isHapticsSupported = Platform.OS !== "web";

/**
 * Light haptic feedback for subtle interactions
 * Use for: tab switches, toggles, checkbox selections
 */
export const lightHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Medium haptic feedback for standard interactions  
 * Use for: button presses, card selections, navigation
 */
export const mediumHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Heavy haptic feedback for significant actions
 * Use for: confirmations, important completions, major state changes
 */
export const heavyHaptic = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Selection haptic for picker/selection changes
 * Use for: scrolling through options, selecting items in a list
 */
export const selectionHaptic = () => {
  if (isHapticsSupported) {
    Haptics.selectionAsync();
  }
};

/**
 * Success haptic pattern for positive outcomes
 * Use for: bookmarking, saving, successful submissions
 */
export const successHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Warning haptic pattern for cautionary feedback
 * Use for: validation issues, approaching limits
 */
export const warningHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Error haptic pattern for negative outcomes
 * Use for: errors, failed actions, destructive confirmations
 */
export const errorHaptic = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

