import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  DimensionValue,
  AccessibilityInfo,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type PositionValue = DimensionValue | undefined;

type EtherealBackgroundVariant = "default" | "guidance" | "chat" | "conversations" | "bookmarks";
type EtherealBackgroundIntensity = "low" | "medium";

interface EtherealBackgroundProps {
  variant?: EtherealBackgroundVariant;
  intensity?: EtherealBackgroundIntensity;
}

const natureLeafImage = require("../../assets/HomeScreenAssets/nature.png");

const decorativeLeaves: {
  top?: PositionValue;
  bottom?: PositionValue;
  left?: number;
  right?: number;
  size: number;
  rotation: number;
  opacity: number;
}[] = [
  { top: "8%" as PositionValue, left: -34, size: 130, rotation: -16, opacity: 0.09 },
  { top: "22%" as PositionValue, right: -44, size: 156, rotation: 38, opacity: 0.08 },
  { bottom: "18%" as PositionValue, left: -16, size: 116, rotation: -34, opacity: 0.08 },
  { bottom: "9%" as PositionValue, right: -24, size: 138, rotation: 18, opacity: 0.09 },
];

const floatingLeaves: {
  top?: PositionValue;
  bottom?: PositionValue;
  left?: PositionValue;
  right?: PositionValue;
  size: number;
  opacity: number;
  rotation: number;
}[] = [
  { top: "14%" as PositionValue, left: "12%" as PositionValue, size: 48, opacity: 0.1, rotation: 14 },
  { top: "34%" as PositionValue, right: "9%" as PositionValue, size: 42, opacity: 0.09, rotation: -24 },
  { top: "58%" as PositionValue, left: "66%" as PositionValue, size: 38, opacity: 0.08, rotation: 28 },
  { bottom: "18%" as PositionValue, right: "26%" as PositionValue, size: 46, opacity: 0.1, rotation: -38 },
];

const sparkles: {
  top?: PositionValue;
  bottom?: PositionValue;
  left?: PositionValue;
  right?: PositionValue;
  size: number;
  delay: number;
}[] = [
  { top: "16%" as PositionValue, left: "28%" as PositionValue, size: 4, delay: 0 },
  { top: "42%" as PositionValue, right: "18%" as PositionValue, size: 3, delay: 700 },
  { top: "66%" as PositionValue, left: "20%" as PositionValue, size: 3, delay: 1200 },
  { bottom: "22%" as PositionValue, right: "34%" as PositionValue, size: 4, delay: 500 },
];

function getVariantGlowStyle(variant: EtherealBackgroundVariant) {
  switch (variant) {
    case "chat":
      return styles.variantGlowChat;
    case "conversations":
      return styles.variantGlowConversations;
    case "bookmarks":
      return styles.variantGlowBookmarks;
    case "guidance":
      return styles.variantGlowGuidance;
    default:
      return styles.variantGlowDefault;
  }
}

function getVariantCounterGlowStyle(variant: EtherealBackgroundVariant) {
  switch (variant) {
    case "chat":
      return styles.counterGlowChat;
    case "conversations":
      return styles.counterGlowConversations;
    case "bookmarks":
      return styles.counterGlowBookmarks;
    case "guidance":
      return styles.counterGlowGuidance;
    default:
      return styles.counterGlowDefault;
  }
}

function getVariantGlowDirection(variant: EtherealBackgroundVariant) {
  switch (variant) {
    case "chat":
      return { start: { x: 0.06, y: 0.18 }, end: { x: 0.92, y: 1 } };
    case "conversations":
      return { start: { x: 1, y: 0.08 }, end: { x: 0.18, y: 0.9 } };
    case "bookmarks":
      return { start: { x: 0.12, y: 0.96 }, end: { x: 0.95, y: 0.12 } };
    case "guidance":
      return { start: { x: 0.82, y: 0.12 }, end: { x: 0.18, y: 0.92 } };
    default:
      return { start: { x: 1, y: 0 }, end: { x: 0.2, y: 0.9 } };
  }
}

function getVariantCounterGlowDirection(variant: EtherealBackgroundVariant) {
  switch (variant) {
    case "chat":
      return { start: { x: 0.86, y: 0.02 }, end: { x: 0.14, y: 0.94 } };
    case "conversations":
      return { start: { x: 0.14, y: 0.9 }, end: { x: 0.86, y: 0.1 } };
    case "bookmarks":
      return { start: { x: 0.82, y: 0.12 }, end: { x: 0.16, y: 0.92 } };
    case "guidance":
      return { start: { x: 0.08, y: 0.16 }, end: { x: 0.9, y: 0.86 } };
    default:
      return { start: { x: 0.14, y: 0.9 }, end: { x: 0.84, y: 0.1 } };
  }
}

function FloatingLeaf({
  leaf,
  index,
  reducedMotion,
}: {
  leaf: (typeof floatingLeaves)[0];
  index: number;
  reducedMotion: boolean;
}) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const swayAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      floatAnim.setValue(0);
      swayAnim.setValue(0);
      rotateAnim.setValue(0);
      return;
    }

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 7000 + index * 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 7000 + index * 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 6200 + index * 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 6200 + index * 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: 0,
          duration: 6200 + index * 650,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const rotateLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 9000 + index * 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 9000 + index * 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    floatLoop.start();
    swayLoop.start();
    rotateLoop.start();

    return () => {
      floatLoop.stop();
      swayLoop.stop();
      rotateLoop.stop();
    };
  }, [floatAnim, index, reducedMotion, rotateAnim, swayAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10 - index * 2],
  });

  const translateX = swayAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-6, 0, 6],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${leaf.rotation}deg`, `${leaf.rotation + 9}deg`],
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

function Sparkle({
  sparkle,
  index,
}: {
  sparkle: (typeof sparkles)[0];
  index: number;
}) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(sparkle.delay),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0.45,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 650,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.5,
            duration: 650,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1800 + index * 220),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [index, opacityAnim, scaleAnim, sparkle.delay]);

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

export function EtherealBackground({
  variant = "default",
  intensity = "medium",
}: EtherealBackgroundProps) {
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false);
  const shimmerOpacity = useRef(new Animated.Value(0.28)).current;

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (isMounted) {
          setIsReduceMotionEnabled(enabled);
        }
      })
      .catch(() => {});

    if (typeof AccessibilityInfo.isReduceTransparencyEnabled === "function") {
      AccessibilityInfo.isReduceTransparencyEnabled()
        .then((enabled) => {
          if (isMounted) {
            setIsReduceTransparencyEnabled(enabled);
          }
        })
        .catch(() => {});
    }

    const motionSubscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsReduceMotionEnabled
    );

    return () => {
      isMounted = false;
      motionSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isReduceMotionEnabled) {
      shimmerOpacity.setValue(0.22);
      return;
    }

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 0.48,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerOpacity, {
          toValue: 0.24,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    shimmerLoop.start();
    return () => {
      shimmerLoop.stop();
    };
  }, [isReduceMotionEnabled, shimmerOpacity]);

  const activeLeaves = useMemo(
    () => floatingLeaves.slice(0, intensity === "low" ? 2 : floatingLeaves.length),
    [intensity]
  );

  const activeSparkles = useMemo(
    () => sparkles.slice(0, intensity === "low" ? 2 : sparkles.length),
    [intensity]
  );

  const variantGlow = getVariantGlowStyle(variant);
  const counterGlow = getVariantCounterGlowStyle(variant);
  const variantDirection = getVariantGlowDirection(variant);
  const counterVariantDirection = getVariantCounterGlowDirection(variant);
  const variantGlowColors: readonly [string, string, string] = isReduceTransparencyEnabled
    ? ["rgba(16, 185, 129, 0.1)", "rgba(16, 185, 129, 0.05)", "transparent"]
    : ["rgba(16, 185, 129, 0.18)", "rgba(16, 185, 129, 0.08)", "transparent"];
  const counterGlowColors: readonly [string, string, string] = isReduceTransparencyEnabled
    ? ["rgba(52, 211, 153, 0.06)", "rgba(45, 212, 191, 0.03)", "transparent"]
    : ["rgba(52, 211, 153, 0.11)", "rgba(45, 212, 191, 0.05)", "transparent"];
  const centerContrastColors: readonly [string, string, string] = isReduceTransparencyEnabled
    ? ["rgba(16, 185, 129, 0.03)", "rgba(16, 185, 129, 0.045)", "rgba(16, 185, 129, 0.03)"]
    : ["rgba(16, 185, 129, 0.045)", "rgba(16, 185, 129, 0.07)", "rgba(16, 185, 129, 0.045)"];
  const edgeFrameColors: readonly [string, string, string, string] = isReduceTransparencyEnabled
    ? ["rgba(15, 23, 42, 0.03)", "transparent", "transparent", "rgba(15, 23, 42, 0.02)"]
    : ["rgba(15, 23, 42, 0.06)", "transparent", "transparent", "rgba(15, 23, 42, 0.04)"];

  const baseGradientColors = isReduceTransparencyEnabled
    ? (["#eef8f2", "#e9f5ee", "#eef8f2", "#e4f1e9", "#edf7f1"] as const)
    : (["#ecf8ef", "#e7f5ec", "#eefaf3", "#e0f1e7", "#eaf7ee"] as const);

  return (
    <View pointerEvents="none" style={styles.container}>
      <LinearGradient
        colors={baseGradientColors}
        locations={[0, 0.24, 0.5, 0.76, 1]}
        style={styles.baseGradient}
      />

      <LinearGradient
        colors={variantGlowColors}
        locations={[0, 0.42, 1]}
        start={variantDirection.start}
        end={variantDirection.end}
        style={[styles.variantGlowBase, variantGlow]}
      />

      <LinearGradient
        colors={counterGlowColors}
        locations={[0, 0.44, 1]}
        start={counterVariantDirection.start}
        end={counterVariantDirection.end}
        style={[styles.counterGlowBase, counterGlow]}
      />

      <LinearGradient
        colors={centerContrastColors}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.centerContrast}
      />

      <LinearGradient
        colors={["transparent", "rgba(16, 185, 129, 0.03)", "rgba(240, 253, 244, 0.24)"]}
        locations={[0, 0.52, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGlow}
      />

      <Animated.View style={[styles.shimmerWrap, { opacity: shimmerOpacity }]}>
        <LinearGradient
          colors={["transparent", "rgba(255, 255, 255, 0.52)", "rgba(240, 253, 244, 0.42)", "transparent"]}
          locations={[0, 0.32, 0.64, 1]}
          start={{ x: 0.08, y: 0.24 }}
          end={{ x: 0.96, y: 0.76 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>

      {!isReduceTransparencyEnabled && (
        <>
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.08)", "transparent", "rgba(255, 255, 255, 0.05)"]}
            locations={[0, 0.48, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.textureOverlay}
          />
          <LinearGradient
            colors={["rgba(15, 23, 42, 0.03)", "transparent", "rgba(255, 255, 255, 0.04)"]}
            locations={[0, 0.46, 1]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.textureOverlay}
          />
        </>
      )}

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

      {activeLeaves.map((leaf, index) => (
        <FloatingLeaf
          key={`leaf-${index}`}
          leaf={leaf}
          index={index}
          reducedMotion={isReduceMotionEnabled}
        />
      ))}

      {!isReduceMotionEnabled &&
        activeSparkles.map((sparkle, index) => (
          <Sparkle key={`sparkle-${index}`} sparkle={sparkle} index={index} />
        ))}

      <LinearGradient
        colors={edgeFrameColors}
        locations={[0, 0.18, 0.82, 1]}
        style={styles.edgeFrame}
      />

      <LinearGradient
        colors={["rgba(240, 253, 244, 0.22)", "transparent", "transparent", "rgba(240, 253, 244, 0.16)"]}
        locations={[0, 0.15, 0.84, 1]}
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
  variantGlowBase: {
    position: "absolute",
    width: "96%",
    height: "60%",
    borderRadius: 999,
  },
  counterGlowBase: {
    position: "absolute",
    width: "88%",
    height: "54%",
    borderRadius: 999,
  },
  variantGlowDefault: {
    top: "-8%",
    right: "-22%",
  },
  variantGlowGuidance: {
    top: "16%",
    right: "-26%",
  },
  variantGlowChat: {
    top: "30%",
    left: "-24%",
  },
  variantGlowConversations: {
    top: "-10%",
    right: "-16%",
  },
  variantGlowBookmarks: {
    bottom: "-8%",
    left: "-18%",
  },
  counterGlowDefault: {
    bottom: "-14%",
    left: "-14%",
  },
  counterGlowGuidance: {
    top: "-20%",
    left: "-14%",
  },
  counterGlowChat: {
    top: "-16%",
    right: "-12%",
  },
  counterGlowConversations: {
    bottom: "-18%",
    left: "-18%",
  },
  counterGlowBookmarks: {
    top: "14%",
    right: "-28%",
  },
  centerContrast: {
    position: "absolute",
    left: "-12%",
    width: "124%",
    top: "20%",
    height: "56%",
    borderRadius: 999,
  },
  shimmerWrap: {
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
    height: "42%",
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  edgeFrame: {
    ...StyleSheet.absoluteFillObject,
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
    borderRadius: 8,
    ...Platform.select({
      web: {
        boxShadow: "0 0 4px rgba(16, 185, 129, 0.25)",
      } as any,
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      default: {},
    }),
  },
});
