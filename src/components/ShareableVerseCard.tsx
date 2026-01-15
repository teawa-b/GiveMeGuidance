import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface ShareableVerseCardProps {
  verseText: string;
  verseReference: string;
}

const { width: screenWidth } = Dimensions.get("window");
// Card width for social sharing
const CARD_WIDTH = Math.min(screenWidth - 48, 360);

// Calculate font size based on text length
const getVerseFontSize = (text: string) => {
  const length = text.length;
  if (length < 80) return 24;
  if (length < 120) return 22;
  if (length < 180) return 20;
  if (length < 250) return 18;
  if (length < 350) return 16;
  return 14;
};

const getVerseLineHeight = (fontSize: number) => fontSize * 1.55;

// Calculate dynamic height based on text length
const getCardHeight = (text: string) => {
  const length = text.length;
  if (length < 80) return CARD_WIDTH * 0.85;
  if (length < 120) return CARD_WIDTH * 0.95;
  if (length < 180) return CARD_WIDTH * 1.05;
  if (length < 250) return CARD_WIDTH * 1.15;
  if (length < 350) return CARD_WIDTH * 1.3;
  return CARD_WIDTH * 1.45;
};

export const ShareableVerseCard = forwardRef<View, ShareableVerseCardProps>(
  ({ verseText, verseReference }, ref) => {
    const fontSize = getVerseFontSize(verseText);
    const lineHeight = getVerseLineHeight(fontSize);
    const cardHeight = getCardHeight(verseText);
    
    return (
      <View ref={ref} style={[styles.container, { height: cardHeight }]} collapsable={false}>
        {/* Beautiful gradient background */}
        <LinearGradient
          colors={["#f0fdf4", "#ecfdf5", "#d1fae5", "#a7f3d0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        />
        
        {/* Decorative corner accents */}
        <View style={styles.cornerTopLeft}>
          <View style={styles.cornerLine} />
          <View style={[styles.cornerLine, styles.cornerLineVertical]} />
        </View>
        <View style={styles.cornerBottomRight}>
          <View style={styles.cornerLine} />
          <View style={[styles.cornerLine, styles.cornerLineVertical]} />
        </View>
        
        {/* Decorative circles */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Opening quote */}
          <Text style={styles.quoteIcon}>"</Text>
          
          {/* Verse text */}
          <Text style={[styles.verseText, { fontSize, lineHeight }]}>
            {verseText}
          </Text>
          
          {/* Closing quote */}
          <Text style={styles.quoteIconClose}>"</Text>
          
          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>
          
          {/* Reference */}
          <Text style={styles.reference}>{verseReference}</Text>
        </View>
        
        {/* Branding footer */}
        <View style={styles.brandingContainer}>
          <View style={styles.brandingContent}>
            <Text style={styles.brandingIcon}>🍃</Text>
            <Text style={styles.brandingText}>Give Me Guidance</Text>
          </View>
        </View>
      </View>
    );
  }
);

ShareableVerseCard.displayName = "ShareableVerseCard";

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    minHeight: CARD_WIDTH * 0.85,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0fdf4",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  cornerTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 30,
    height: 30,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 50,
    right: 20,
    width: 30,
    height: 30,
    transform: [{ rotate: "180deg" }],
  },
  cornerLine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 24,
    height: 2,
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 1,
  },
  cornerLineVertical: {
    width: 2,
    height: 24,
  },
  decorativeCircle1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
  },
  decorativeCircle2: {
    position: "absolute",
    bottom: 30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(16, 185, 129, 0.06)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  quoteIcon: {
    fontSize: 48,
    color: "rgba(16, 185, 129, 0.3)",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" }),
    lineHeight: 48,
    marginBottom: 8,
  },
  quoteIconClose: {
    fontSize: 48,
    color: "rgba(16, 185, 129, 0.3)",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" }),
    lineHeight: 48,
    marginTop: 8,
    alignSelf: "flex-end",
    marginRight: 8,
  },
  verseText: {
    fontWeight: "500",
    color: "#1e3a2f",
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" }),
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
    gap: 12,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(16, 185, 129, 0.3)",
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10b981",
  },
  reference: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brandingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  brandingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brandingIcon: {
    fontSize: 16,
  },
  brandingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
  },
});
