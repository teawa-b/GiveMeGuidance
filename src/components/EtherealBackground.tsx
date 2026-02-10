import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Animated, Easing, Image, DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

// Type for position values
type PositionValue = DimensionValue | undefined;

// Nature leaf image
const natureLeafImage = require("../../assets/HomeScreenAssets/nature.png");

// Decorative leaf PNG positions - positioned around edges like the HTML design
const decorativeLeaves: { top?: PositionValue; bottom?: PositionValue; left?: number; right?: number; size: number; rotation: number; opacity: number }[] = [
  { top: "10%" as PositionValue, left: -50, size: 150, rotation: -15, opacity: 0.12 },
  { top: "25%" as PositionValue, right: -60, size: 200, rotation: 45, opacity: 0.1 },
  { bottom: "20%" as PositionValue, left: -30, size: 120, rotation: -45, opacity: 0.12 },
  { bottom: "10%" as PositionValue, right: -40, size: 180, rotation: 15, opacity: 0.1 },
];

// Floating leaves for depth - enhanced with more variety
const floatingLeaves: { top?: PositionValue; bottom?: PositionValue; left?: PositionValue; right?: PositionValue; size: number; opacity: number; rotation: number }[] = [
  { top: "10%" as PositionValue, left: "15%" as PositionValue, size: 60, opacity: 0.25, rotation: 15 },
  { top: "25%" as PositionValue, right: "10%" as PositionValue, size: 45, opacity: 0.2, rotation: -30 },
  { bottom: "35%" as PositionValue, left: "5%" as PositionValue, size: 55, opacity: 0.22, rotation: 45 },
  { top: "55%" as PositionValue, right: "20%" as PositionValue, size: 70, opacity: 0.18, rotation: -15 },
  { top: "40%" as PositionValue, left: "60%" as PositionValue, size: 40, opacity: 0.2, rotation: 60 },
  { bottom: "15%" as PositionValue, right: "40%" as PositionValue, size: 50, opacity: 0.25, rotation: -45 },
  { top: "70%" as PositionValue, left: "25%" as PositionValue, size: 45, opacity: 0.18, rotation: 30 },
  { bottom: "50%" as PositionValue, right: "5%" as PositionValue, size: 55, opacity: 0.2, rotation: -60 },
];

// Sparkle particles for extra magic - emerald themed
const sparkles: { top?: PositionValue; bottom?: PositionValue; left?: PositionValue; right?: PositionValue; size: number; delay: number }[] = [
  { top: "12%" as PositionValue, left: "30%" as PositionValue, size: 6, delay: 0 },
  { top: "28%" as PositionValue, right: "25%" as PositionValue, size: 4, delay: 800 },
  { top: "45%" as PositionValue, left: "70%" as PositionValue, size: 5, delay: 400 },
  { top: "62%" as PositionValue, left: "20%" as PositionValue, size: 4, delay: 1200 },
  { top: "75%" as PositionValue, right: "35%" as PositionValue, size: 6, delay: 600 },
  { bottom: "20%" as PositionValue, left: "45%" as PositionValue, size: 5, delay: 1000 },
  { top: "35%" as PositionValue, left: "85%" as PositionValue, size: 4, delay: 200 },
  { bottom: "40%" as PositionValue, right: "15%" as PositionValue, size: 5, delay: 1400 },
];

// Animated floating leaf component
function FloatingLeaf({ leaf, index }: { leaf: typeof floatingLeaves[0]; index: number }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating up/down animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000 + index * 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000 + index * 500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Swaying side to side animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 2500 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 2500 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 2500 + index * 400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 4000 + index * 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 4000 + index * 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20 - index * 3],
  });

  const translateX = swayAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${leaf.rotation}deg`, `${leaf.rotation + 15}deg`],
  });

  return (
    <Animated.Image
      source={natureLeafImage}
      style={[
        styles.floatingLeaf,
        {
          top: leaf.top,
          left: leaf.left,
          right: leaf.right,
          bottom: leaf.bottom,
          width: leaf.size,
          height: leaf.size,
          opacity: leaf.opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
      resizeMode="contain"
    />
  );
}

// Animated sparkle component
function Sparkle({ sparkle, index }: { sparkle: typeof sparkles[0]; index: number }) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(sparkle.delay),
          Animated.parallel([
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 800,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(400),
          Animated.parallel([
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 600,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.5,
              duration: 600,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(1500 + index * 200),
        ])
      ).start();
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          top: sparkle.top,
          left: sparkle.left,
          right: sparkle.right,
          bottom: sparkle.bottom,
          width: sparkle.size,
          height: sparkle.size,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    />
  );
}

export function EtherealBackground() {
  return (
    <View style={styles.container}>
      {/* Base gradient - Light minty white (#f0fdf4) inspired background */}
      <LinearGradient
        colors={["#f0fdf4", "#ecfdf5", "#f0fdf4", "#e6f9ed", "#f0fdf4"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={styles.baseGradient}
      />

      {/* Radial-like accent from top-right - subtle emerald glow */}
      <LinearGradient
        colors={["rgba(16, 185, 129, 0.06)", "rgba(16, 185, 129, 0.03)", "transparent"]}
        locations={[0, 0.4, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={styles.accentGradient}
      />

      {/* Diagonal shimmer accent - gentle light effect */}
      <LinearGradient
        colors={["transparent", "rgba(255, 255, 255, 0.5)", "rgba(240, 253, 244, 0.4)", "transparent"]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.7 }}
        style={styles.shimmerGradient}
      />

      {/* Bottom glow - soft emerald warmth */}
      <LinearGradient
        colors={["transparent", "rgba(16, 185, 129, 0.03)", "rgba(240, 253, 244, 0.3)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGlow}
      />

      {/* Decorative leaf PNGs around edges - like the HTML leaf shapes */}
      {decorativeLeaves.map((leaf, index) => (
        <Image
          key={`decorative-${index}`}
          source={natureLeafImage}
          style={[
            styles.decorativeLeaf,
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
          resizeMode="contain"
        />
      ))}

      {/* Animated floating leaves */}
      {floatingLeaves.map((leaf, index) => (
        <FloatingLeaf key={`leaf-${index}`} leaf={leaf} index={index} />
      ))}

      {/* Sparkle particles */}
      {sparkles.map((sparkle, index) => (
        <Sparkle key={`sparkle-${index}`} sparkle={sparkle} index={index} />
      ))}

      {/* Soft vignette overlay for depth */}
      <LinearGradient
        colors={["rgba(240, 253, 244, 0.3)", "transparent", "transparent", "rgba(240, 253, 244, 0.2)"]}
        locations={[0, 0.15, 0.85, 1]}
        style={styles.vignetteOverlay}
      />
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
  shimmerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  vignetteOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeLeaf: {
    position: "absolute",
  },
  floatingLeaf: {
    position: "absolute",
  },
  sparkle: {
    position: "absolute",
    backgroundColor: "#d1fae5",
    borderRadius: 10,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
});
