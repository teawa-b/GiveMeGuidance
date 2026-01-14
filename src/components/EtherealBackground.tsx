import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Abstract leaf shapes - decorative rounded corner elements
const leafShapes = [
  { top: "5%", left: -60, size: 180, rotation: -15, opacity: 0.15 },
  { top: "20%", right: -80, size: 240, rotation: 45, opacity: 0.18 },
  { top: "45%", left: -40, size: 160, rotation: 30, opacity: 0.12 },
  { bottom: "25%", right: -50, size: 200, rotation: -30, opacity: 0.14 },
  { bottom: "8%", left: -30, size: 140, rotation: -45, opacity: 0.16 },
  { bottom: "5%", right: -60, size: 220, rotation: 15, opacity: 0.12 },
];

// Floating orbs for depth
const orbs = [
  { top: "15%", left: "20%", size: 120, opacity: 0.08 },
  { top: "35%", right: "15%", size: 80, opacity: 0.06 },
  { bottom: "30%", left: "10%", size: 100, opacity: 0.07 },
  { top: "60%", right: "25%", size: 140, opacity: 0.05 },
];

export function EtherealBackground() {
  return (
    <View style={styles.container}>
      {/* Base gradient - richer green tones */}
      <LinearGradient
        colors={["#ecfdf5", "#d1fae5", "#f0fdf4", "#fafaf9"]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.baseGradient}
      />

      {/* Accent gradient overlay */}
      <LinearGradient
        colors={["transparent", "rgba(16, 185, 129, 0.05)", "rgba(52, 211, 153, 0.08)", "transparent"]}
        locations={[0, 0.3, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.accentGradient}
      />

      {/* Floating orbs */}
      {orbs.map((orb, index) => (
        <View
          key={`orb-${index}`}
          style={[
            styles.orb,
            {
              top: orb.top,
              left: orb.left,
              right: orb.right,
              bottom: orb.bottom,
              width: orb.size,
              height: orb.size,
              opacity: orb.opacity,
              borderRadius: orb.size / 2,
            },
          ]}
        />
      ))}

      {/* Abstract leaf shapes */}
      {leafShapes.map((leaf, index) => (
        <View
          key={`leaf-${index}`}
          style={[
            styles.leafShape,
            {
              top: leaf.top,
              bottom: leaf.bottom,
              left: leaf.left,
              right: leaf.right,
              width: leaf.size,
              height: leaf.size,
              opacity: leaf.opacity,
              transform: [{ rotate: `${leaf.rotation}deg` }],
            },
          ]}
        />
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
  accentGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: "absolute",
    backgroundColor: "#10b981",
  },
  leafShape: {
    position: "absolute",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 1000,
    borderBottomRightRadius: 0,
  },
});
