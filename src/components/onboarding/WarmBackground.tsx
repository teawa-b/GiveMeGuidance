import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  DimensionValue,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type PosVal = DimensionValue | undefined;
const natureLeafImage = require("../../../assets/HomeScreenAssets/nature.png");

const decorativeLeaves: {
  top?: PosVal;
  bottom?: PosVal;
  left?: number;
  right?: number;
  size: number;
  rotation: number;
  opacity: number;
}[] = [
  { top: "8%" as PosVal, left: -20, size: 128, rotation: -18, opacity: 0.18 },
  { top: "22%" as PosVal, right: -24, size: 146, rotation: 35, opacity: 0.16 },
  { bottom: "18%" as PosVal, left: -14, size: 110, rotation: -36, opacity: 0.17 },
  { bottom: "8%" as PosVal, right: -20, size: 132, rotation: 18, opacity: 0.16 },
];

const sparkles: {
  top?: PosVal;
  bottom?: PosVal;
  left?: PosVal;
  right?: PosVal;
  size: number;
  delay: number;
}[] = [
  { top: "15%" as PosVal, left: "28%" as PosVal, size: 5, delay: 0 },
  { top: "30%" as PosVal, right: "22%" as PosVal, size: 4, delay: 900 },
  { top: "48%" as PosVal, left: "65%" as PosVal, size: 4, delay: 500 },
  { top: "60%" as PosVal, left: "18%" as PosVal, size: 3, delay: 1300 },
  { top: "72%" as PosVal, right: "30%" as PosVal, size: 5, delay: 700 },
  { bottom: "18%" as PosVal, left: "40%" as PosVal, size: 4, delay: 1100 },
];

function Sparkle({ sparkle, index }: { sparkle: (typeof sparkles)[0]; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (Platform.OS === "web") return;

    Animated.loop(
      Animated.sequence([
        Animated.delay(sparkle.delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.4,
            duration: 600,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1600 + index * 220),
      ])
    ).start();
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
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

/**
 * A warm, cozy background for onboarding screens.
 * Cream-sage gradient with subtle gold sparkles.
 */
export function WarmBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" as any }]}> 
      <LinearGradient
        colors={["#FFF8F0", "#F4F9F4", "#FFF8F0", "#F2F7F0", "#FFF8F0"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={["rgba(91, 140, 90, 0.04)", "rgba(91, 140, 90, 0.02)", "transparent"]}
        locations={[0, 0.4, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={["transparent", "rgba(212, 168, 67, 0.025)", "rgba(255, 248, 240, 0.3)"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGlow}
      />

      {decorativeLeaves.map((leaf, i) => (
        <Image
          key={`leaf-${i}`}
          source={natureLeafImage}
          style={[
            styles.leafAbs,
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

      {sparkles.map((s, i) => (
        <Sparkle key={`sp-${i}`} sparkle={s} index={i} />
      ))}

      <LinearGradient
        colors={["rgba(255, 248, 240, 0.25)", "transparent", "transparent", "rgba(255, 248, 240, 0.2)"]}
        locations={[0, 0.15, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomGlow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  leafAbs: {
    position: "absolute",
  },
  sparkle: {
    position: "absolute",
    backgroundColor: "#D4A843",
    borderRadius: 10,
    ...Platform.select({
      web: { boxShadow: "0 0 4px rgba(212, 168, 67, 0.5)" } as any,
      ios: {
        shadowColor: "#D4A843",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      default: {},
    }),
  },
});
