import React, { useRef, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  onNewChat: () => void;
  masterMode?: boolean;
  onMasterPress: () => void;
  crownPulse?: Animated.Value;
}

export function PhoenixHeader({ onNewChat, masterMode, onMasterPress, crownPulse }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const pulseOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: topPadding + 10,
          backgroundColor: colors.background,
          borderBottomColor: masterMode ? colors.primary + "88" : colors.border,
          borderBottomWidth: masterMode ? 1 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <Animated.Text
        style={[styles.logo, { color: colors.foreground, opacity: pulseOpacity }]}
      >
        Anx<Text style={{ color: colors.accent }}>S</Text>Pheonex
      </Animated.Text>

      <View style={styles.rightButtons}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onMasterPress();
          }}
          style={[
            styles.masterBtn,
            {
              backgroundColor: masterMode ? colors.primary + "22" : colors.secondary,
              borderColor: masterMode ? colors.primary : colors.border,
              borderRadius: colors.radius,
            },
          ]}
          testID="master-mode-button"
        >
          <Animated.View style={crownPulse ? { transform: [{ scale: crownPulse }] } : undefined}>
            <Ionicons
              name={masterMode ? "shield-half" : "shield-half-outline"}
              size={14}
              color={masterMode ? colors.accent : colors.mutedForeground}
            />
          </Animated.View>
          <Text
            style={[
              styles.masterBtnText,
              { color: masterMode ? colors.accent : colors.mutedForeground },
            ]}
          >
            {masterMode ? "Master" : "Master Mode"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onNewChat();
          }}
          style={styles.iconBtn}
          testID="new-chat-button"
        >
          <Ionicons name="create-outline" size={22} color={colors.accent} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  logo: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  masterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  masterBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  iconBtn: {
    padding: 8,
  },
});
