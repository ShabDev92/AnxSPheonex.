import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

export function EmptyState() {
  const colors = useColors();
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const creditOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(creditOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { paddingBottom: Platform.OS === "web" ? 34 : 0 }]}>
      <Animated.View style={[styles.nameWrap, { opacity, transform: [{ scale }] }]}>
        <Text style={[styles.nameTop, { color: colors.foreground }]}>Anx</Text>
        <View style={styles.glowRow}>
          <Text style={[styles.nameMid, { color: colors.accent }]}>S</Text>
          <Text style={[styles.nameBot, { color: colors.foreground }]}>Pheonex</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.primary }]} />
        <Animated.Text style={[styles.credits, { color: colors.mutedForeground, opacity: creditOpacity }]}>
          Credits to Abstract Shabz
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  nameWrap: {
    alignItems: "center",
    gap: 4,
  },
  nameTop: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    letterSpacing: -3,
    lineHeight: 56,
  },
  glowRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  nameMid: {
    fontSize: 64,
    fontFamily: "Inter_700Bold",
    letterSpacing: -3,
    lineHeight: 68,
  },
  nameBot: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    letterSpacing: -3,
    lineHeight: 68,
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginTop: 16,
    marginBottom: 12,
  },
  credits: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
