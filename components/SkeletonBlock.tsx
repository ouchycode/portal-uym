import { Colors } from "@/constants/theme";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

type Props = {
  width?: number | `${number}%`;
  height?: number;
};

export function SkeletonBlock({ width = "100%", height = 12 }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <View style={[styles.block, { width: width as any, height }]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.shimmer, { opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: Colors.skeletonBase,
    borderRadius: 6,
    overflow: "hidden",
  },
  shimmer: {
    backgroundColor: "#fff",
    opacity: 0.4,
  },
});
