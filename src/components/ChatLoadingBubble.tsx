import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Platform, Animated, Easing, Image } from "react-native";

// Bird icon for chat avatar
const appLogo = require("../../assets/mascot/bird-reading.png");

interface ChatLoadingBubbleProps {
  size?: "small" | "medium" | "large";
}

export function ChatLoadingBubble({ size = "medium" }: ChatLoadingBubbleProps) {
  const dotSize = size === "small" ? 6 : size === "medium" ? 8 : 10;
  const spacing = size === "small" ? 14 : size === "medium" ? 18 : 22;

  // Animation values for each dot
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = 400;

    const createBounceAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    const anim1 = createBounceAnimation(dot1Anim, 0);
    const anim2 = createBounceAnimation(dot2Anim, 150);
    const anim3 = createBounceAnimation(dot3Anim, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  const createDotStyle = (animValue: Animated.Value) => ({
    width: dotSize,
    height: dotSize,
    borderRadius: dotSize / 2,
    backgroundColor: "#10b981",
    marginHorizontal: spacing / 4,
    transform: [
      {
        translateY: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -8],
        }),
      },
    ],
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
  });

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        <Image source={appLogo} style={styles.avatarImage} resizeMode="contain" />
      </View>
      <View style={styles.bubbleContainer}>
        <View style={styles.dotsContainer}>
          <Animated.View style={createDotStyle(dot1Anim)} />
          <Animated.View style={createDotStyle(dot2Anim)} />
          <Animated.View style={createDotStyle(dot3Anim)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    overflow: "hidden",
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  bubbleContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      default: {
        elevation: 1,
      },
    }),
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
  },
});

