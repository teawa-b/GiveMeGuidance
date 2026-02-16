/**
 * Shared onboarding design tokens.
 * Import these in every onboarding screen so the palette stays consistent.
 */

import { Platform, ViewStyle } from "react-native";

export const OB_COLORS = {
  // Core palette
  primary: "#5B8C5A",
  primaryLight: "#E8F5E9",
  primaryMid: "rgba(91, 140, 90, 0.15)",
  primaryDark: "#3D6B3D",

  // Accent â€“ drawn from the mascot's golden halo
  gold: "#D4A843",
  goldLight: "#FFF3D4",
  goldSoft: "rgba(212, 168, 67, 0.12)",

  // Backgrounds
  cream: "#FFF8F0",
  warmWhite: "#FFFDF9",

  // Surfaces
  surface: "#FFFFFF",
  surfaceSoft: "rgba(255, 255, 255, 0.92)",

  // Text
  textDark: "#2D3436",
  textBody: "#4A5568",
  textMuted: "#718096",
  textLight: "#A0AEC0",

  // UI
  border: "#E8EDF2",
  borderSelected: "rgba(91, 140, 90, 0.5)",
  disabled: "#CBD5E0",
  error: "#E53E3E",
  errorBg: "#FFF5F5",
  black: "#000000",
};

/** Standard iOS-style card shadow */
export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#5B8C5A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  ["and" + "roid"]: {},
  default: {},
}) as ViewStyle;

/** Strong button shadow */
export const buttonShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#3D6B3D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  ["and" + "roid"]: {},
  default: {},
}) as ViewStyle;

/** Soft shadow for surfaces */
export const softShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  ["and" + "roid"]: {},
  default: {},
}) as ViewStyle;

