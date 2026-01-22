import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Dimensions, Platform, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Nature leaf image for decorative elements
const natureLeafImage = require("../../assets/HomeScreenAssets/nature.png");

interface ShareableVerseCardProps {
  verseText: string;
  verseReference: string;
}

const { width: screenWidth } = Dimensions.get("window");
// Card dimensions for 16:9 aspect ratio social sharing
const CARD_WIDTH = Math.min(screenWidth - 48, 400);
const CARD_HEIGHT = CARD_WIDTH * (9 / 16); // 16:9 aspect ratio

// Calculate font size based on text length - optimized for 16:9 format
const getVerseFontSize = (text: string) => {
  const length = text.length;
  if (length < 60) return 22;
  if (length < 100) return 20;
  if (length < 150) return 18;
  if (length < 200) return 16;
  if (length < 280) return 14;
  return 12;
};

const getVerseLineHeight = (fontSize: number) => fontSize * 1.5;

export const ShareableVerseCard = forwardRef<View, ShareableVerseCardProps>(
  ({ verseText, verseReference }, ref) => {
    const fontSize = getVerseFontSize(verseText);
    const lineHeight = getVerseLineHeight(fontSize);
    
    return (
      <View ref={ref} style={styles.container} collapsable={false}>
        {/* Beautiful gradient background - matching EtherealBackground */}
        <LinearGradient
          colors={["#f0fdf4", "#ecfdf5", "#f0fdf4", "#e6f9ed", "#f0fdf4"]}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          style={styles.background}
        />
        
        {/* Accent gradient from top-right */}
        <LinearGradient
          colors={["rgba(16, 185, 129, 0.08)", "rgba(16, 185, 129, 0.04)", "transparent"]}
          locations={[0, 0.4, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0.6 }}
          style={styles.accentGradient}
        />
        
        {/* Decorative leaves */}
        <Image
          source={natureLeafImage}
          style={[styles.decorativeLeaf, styles.leafTopLeft]}
          resizeMode="contain"
        />
        <Image
          source={natureLeafImage}
          style={[styles.decorativeLeaf, styles.leafBottomRight]}
          resizeMode="contain"
        />
        <Image
          source={natureLeafImage}
          style={[styles.decorativeLeaf, styles.leafTopRight]}
          resizeMode="contain"
        />
        
        {/* Content */}
        <View style={styles.content}>
          {/* Opening quote */}
          <Text style={styles.quoteIcon}>"</Text>
          
          {/* Verse text */}
          <Text 
            style={[styles.verseText, { fontSize, lineHeight }]}
            numberOfLines={5}
            ellipsizeMode="tail"
          >
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
        
        {/* Branding footer - improved visibility */}
        <LinearGradient
          colors={["transparent", "rgba(240, 253, 244, 0.95)", "#f0fdf4"]}
          style={styles.brandingGradient}
        >
          <View style={styles.brandingContent}>
            <Text style={styles.brandingIcon}>🍃</Text>
            <Text style={styles.brandingText}>Give Me Guidance</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }
);

ShareableVerseCard.displayName = "ShareableVerseCard";

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f0fdf4",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  accentGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeLeaf: {
    position: "absolute",
    tintColor: "#10b981",
  },
  leafTopLeft: {
    top: -20,
    left: -25,
    width: 80,
    height: 80,
    opacity: 0.12,
    transform: [{ rotate: "-15deg" }],
  },
  leafBottomRight: {
    bottom: 30,
    right: -20,
    width: 100,
    height: 100,
    opacity: 0.1,
    transform: [{ rotate: "45deg" }],
  },
  leafTopRight: {
    top: 10,
    right: -15,
    width: 60,
    height: 60,
    opacity: 0.08,
    transform: [{ rotate: "120deg" }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  quoteIcon: {
    fontSize: 36,
    color: "rgba(16, 185, 129, 0.35)",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" }),
    lineHeight: 36,
    marginBottom: 4,
  },
  quoteIconClose: {
    fontSize: 36,
    color: "rgba(16, 185, 129, 0.35)",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" }),
    lineHeight: 36,
    marginTop: 4,
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
    marginTop: 12,
    marginBottom: 8,
    gap: 10,
  },
  dividerLine: {
    width: 32,
    height: 1,
    backgroundColor: "rgba(16, 185, 129, 0.3)",
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#10b981",
  },
  reference: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brandingGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  brandingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  brandingIcon: {
    fontSize: 14,
  },
  brandingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.5,
  },
});
