import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const colors = useColors();
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const scale = useRef(new Animated.Value(1)).current;

  const canSend = text.trim().length > 0 && !disabled;

  function handleSend() {
    if (!canSend) return;
    const msg = text.trim();
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSend(msg);
    inputRef.current?.focus();
  }

  function handlePressIn() {
    if (!canSend) return;
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius + 4,
        },
      ]}
    >
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
        value={text}
        onChangeText={setText}
        placeholder="Say something..."
        placeholderTextColor={colors.mutedForeground}
        multiline
        maxLength={2000}
        blurOnSubmit={false}
        onSubmitEditing={handleSend}
        returnKeyType="send"
      />
      <Pressable
        onPress={handleSend}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!canSend}
        testID="send-button"
      >
        <Animated.View
          style={[
            styles.sendBtn,
            {
              backgroundColor: canSend ? colors.primary : colors.muted,
              borderRadius: colors.radius,
              transform: [{ scale }],
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={18}
            color={canSend ? colors.primaryForeground : colors.mutedForeground}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
