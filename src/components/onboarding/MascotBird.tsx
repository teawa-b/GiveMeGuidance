import React, { useEffect, useRef } from "react";
import { Animated, Image, Easing, ViewStyle, Platform } from "react-native";

export type MascotPose = "reading" | "pointing-up" | "pointing-right";

const mascotImages: Record<MascotPose, any> = {
  reading: require("../../../assets/mascot/bird-reading.png"),
  "pointing-up": require("../../../assets/mascot/bird-pointing-up.png"),
  "pointing-right": require("../../../assets/mascot/bird-pointing-right.png"),
};

const sizeMap = {
  tiny: 48,
  small: 70,
  medium: 110,
  large: 150,
  hero: 190,
};

export type MascotSize = keyof typeof sizeMap;

interface MascotBirdProps {
  pose: MascotPose;
  size?: MascotSize;
  animate?: boolean;
  delay?: number;
  bobAmount?: number;
  style?: ViewStyle;
  flip?: boolean;
}

export function MascotBird({
  pose,
  size = "medium",
  animate = true,
  delay = 0,
  bobAmount = 6,
  style,
  flip = false,
}: MascotBirdProps) {
  const isWeb = Platform.OS === "web";
  // On web, always start visible (no animations)
  const shouldAnimate = animate && !isWeb;
  const bobAnim = useRef(new Animated.Value(0)).current;
  const entranceOpacity = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  const entranceScale = useRef(new Animated.Value(shouldAnimate ? 0.4 : 1)).current;
  const entranceSlide = useRef(new Animated.Value(shouldAnimate ? 30 : 0)).current;

  useEffect(() => {
    if (!shouldAnimate) return;

    const entranceTimer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(entranceOpacity, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(entranceScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(entranceSlide, {
          toValue: 0,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    const bobTimer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bobAnim, {
            toValue: -bobAmount,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(bobAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay + 400);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(bobTimer);
    };
  }, [shouldAnimate, delay, bobAmount]);

  const dim = sizeMap[size];

  return (
    <Animated.View
      style={[
        {
          opacity: entranceOpacity,
          transform: [
            { translateY: Animated.add(bobAnim, entranceSlide) },
            { scale: entranceScale },
            ...(flip ? [{ scaleX: -1 }] : []),
          ],
        },
        style,
      ]}
    >
      <Image
        source={mascotImages[pose]}
        style={{ width: dim, height: dim }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
