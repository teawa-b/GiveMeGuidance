import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Sparkle positions - star-like, smaller and cleaner
const sparkles = [
  { top: "6%", left: "14%", size: 12, opacity: 0.7 },
  { top: "10%", right: "18%", size: 10, opacity: 0.65 },
  { top: "18%", left: "68%", size: 14, opacity: 0.7 },
  { top: "26%", left: "12%", size: 11, opacity: 0.6 },
  { top: "34%", right: "10%", size: 13, opacity: 0.7 },
  { top: "46%", left: "8%", size: 10, opacity: 0.55 },
  { top: "54%", right: "12%", size: 12, opacity: 0.65 },
  { top: "62%", left: "20%", size: 11, opacity: 0.6 },
  { top: "70%", right: "28%", size: 14, opacity: 0.7 },
  { top: "78%", left: "14%", size: 12, opacity: 0.6 },
  { top: "84%", right: "18%", size: 11, opacity: 0.65 },
  { top: "90%", left: "32%", size: 13, opacity: 0.6 },
  { top: "32%", left: "48%", size: 11, opacity: 0.65 },
  { top: "58%", left: "58%", size: 10, opacity: 0.7 },
];

// Floating leaves - smaller, softer
const leaves = [
  { top: "6%", left: "9%", rotation: 22, scale: 0.9, opacity: 0.25 },
  { top: "14%", right: "6%", rotation: -18, scale: 0.8, opacity: 0.22 },
  { top: "32%", left: "-4%", rotation: 40, scale: 1.0, opacity: 0.2 },
  { top: "48%", right: "-3%", rotation: -28, scale: 0.95, opacity: 0.24 },
  { top: "66%", left: "4%", rotation: 55, scale: 0.9, opacity: 0.2 },
  { top: "78%", right: "7%", rotation: -38, scale: 0.85, opacity: 0.23 },
  { top: "88%", left: "18%", rotation: 18, scale: 0.8, opacity: 0.25 },
];

export function EtherealBackground() {
  return (
    <View style={styles.container}>
      {/* Base gradient - soft pastel green to warm ivory */}
      <LinearGradient
        colors={["#f8fdf9", "#f0fdf4", "#ecfdf5", "#faf9f7"]}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.baseGradient}
      />

      {/* Flowing wave layers */}
      <View style={styles.wavesContainer}>
        {/* Wave 1 - Top flowing from left */}
        <LinearGradient
          colors={["rgba(167, 243, 208, 0.3)", "rgba(167, 243, 208, 0.1)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.wave1}
        />
        
        {/* Wave 2 - Middle flowing from right */}
        <LinearGradient
          colors={["transparent", "rgba(209, 250, 229, 0.25)", "rgba(209, 250, 229, 0.08)", "transparent"]}
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.wave2}
        />

        {/* Wave 3 - Bottom accent */}
        <LinearGradient
          colors={["transparent", "rgba(187, 247, 208, 0.2)", "rgba(187, 247, 208, 0.05)"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.wave3}
        />
      </View>

      {/* Edge vignette - subtle darkening */}
      <LinearGradient
        colors={["rgba(167, 243, 208, 0.12)", "transparent", "transparent"]}
        style={styles.topVignette}
      />
      <LinearGradient
        colors={["transparent", "transparent", "rgba(167, 243, 208, 0.15)"]}
        style={styles.bottomVignette}
      />

      {/* Floating leaves */}
      {leaves.map((leaf, index) => (
        <View
          key={`leaf-${index}`}
          style={[
            styles.leaf,
            {
              top: leaf.top,
              left: leaf.left,
              right: leaf.right,
              opacity: leaf.opacity,
              transform: [
                { rotate: `${leaf.rotation}deg` },
                { scale: leaf.scale },
              ],
            },
          ]}
        >
          <View style={styles.leafShape}>
            <LinearGradient
              colors={["rgba(74, 222, 128, 0.9)", "rgba(34, 197, 94, 0.7)", "rgba(22, 163, 74, 0.5)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.leafGradient}
            />
            <View style={styles.leafVein} />
          </View>
        </View>
      ))}

      {/* Sparkles / star particles */}
      {sparkles.map((sparkle, index) => (
        <View
          key={`sparkle-${index}`}
          style={[
            styles.sparkleStar,
            {
              top: sparkle.top,
              left: sparkle.left,
              right: sparkle.right,
              width: sparkle.size,
              height: sparkle.size,
              opacity: sparkle.opacity,
            },
          ]}
        >
          <View
            style={[
              styles.sparkleCrossH,
              {
                width: sparkle.size * 2.2,
              },
            ]}
          />
          <View
            style={[
              styles.sparkleCrossV,
              {
                height: sparkle.size * 2.2,
              },
            ]}
          />
          <View
            style={[
              styles.sparkleGlowRing,
              {
                width: sparkle.size * 2.4,
                height: sparkle.size * 2.4,
                borderRadius: (sparkle.size * 2.4) / 2,
              },
            ]}
          />
          <View
            style={[
              styles.sparkleCore,
              {
                width: sparkle.size * 0.35,
                height: sparkle.size * 0.35,
                borderRadius: (sparkle.size * 0.35) / 2,
              },
            ]}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  baseGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  wavesContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  wave1: {
    position: "absolute",
    top: -50,
    left: -100,
    width: width * 1.5,
    height: height * 0.5,
    borderRadius: 200,
    transform: [{ rotate: "-15deg" }],
  },
  wave2: {
    position: "absolute",
    top: height * 0.25,
    right: -150,
    width: width * 1.4,
    height: height * 0.45,
    borderRadius: 250,
    transform: [{ rotate: "10deg" }],
  },
  wave3: {
    position: "absolute",
    bottom: -100,
    left: -50,
    width: width * 1.3,
    height: height * 0.4,
    borderRadius: 180,
    transform: [{ rotate: "-8deg" }],
  },
  topVignette: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomVignette: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  leaf: {
    position: "absolute",
    width: 42,
    height: 58,
  },
  leafShape: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 35,
    overflow: "hidden",
  },
  leafGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  leafVein: {
    position: "absolute",
    top: "15%",
    left: "45%",
    width: 2,
    height: "70%",
    backgroundColor: "rgba(22, 163, 74, 0.5)",
    borderRadius: 1,
  },
  sparkleStar: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleCrossH: {
    position: "absolute",
    width: 0,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 1,
  },
  sparkleCrossV: {
    position: "absolute",
    width: 2,
    height: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 1,
  },
  sparkleGlowRing: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  sparkleCore: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
});
