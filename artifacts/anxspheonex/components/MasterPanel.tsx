import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Animated,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { MASTER_PROMPT } from "@/constants/prompts";

interface Props {
  visible: boolean;
  onClose: () => void;
  guidelines: string | null;
  onGuidelinesChange: (guidelines: string | null) => void;
}

export function MasterPanel({ visible, onClose, guidelines, onGuidelinesChange }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(800)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const guidelinesEnabled = guidelines !== null;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
        Animated.timing(bgOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: 800, duration: 280, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      setEditing(false);
    }
  }, [visible]);

  const handleToggleGuidelines = (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (enabled) {
      onGuidelinesChange(MASTER_PROMPT);
    } else {
      onGuidelinesChange(null);
    }
  };

  const handleEdit = () => {
    setDraft(guidelines ?? MASTER_PROMPT);
    setEditing(true);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    onGuidelinesChange(trimmed.length > 0 ? trimmed : null);
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleReset = () => {
    setDraft(MASTER_PROMPT);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            borderColor: colors.primary,
            paddingBottom: insets.bottom + 16,
            transform: [{ translateY: slideY }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.primary }]} />

        <View style={styles.titleRow}>
          <View style={styles.titleLeft}>
            <View style={[styles.crownDot, { backgroundColor: colors.accent }]} />
            <Text style={[styles.title, { color: colors.accent }]}>Master Control</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: guidelinesEnabled ? "#1a0f2e" : "#1a0a0a", borderColor: guidelinesEnabled ? colors.primary : colors.destructive }]}>
          <View style={[styles.statusDot, { backgroundColor: guidelinesEnabled ? colors.primary : colors.destructive }]} />
          <Text style={[styles.statusText, { color: guidelinesEnabled ? colors.accent : colors.destructive }]}>
            {guidelinesEnabled ? "Guidelines Active" : "No Restrictions"}
          </Text>
          <Switch
            value={guidelinesEnabled}
            onValueChange={handleToggleGuidelines}
            trackColor={{ false: colors.destructive + "55", true: colors.primary + "88" }}
            thumbColor={guidelinesEnabled ? colors.accent : colors.destructive}
            style={{ marginLeft: "auto" }}
          />
        </View>

        {editing ? (
          <View style={styles.editBlock}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Edit Guidelines
            </Text>
            <TextInput
              style={[
                styles.editor,
                {
                  color: colors.foreground,
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary,
                  borderRadius: colors.radius,
                },
              ]}
              value={draft}
              onChangeText={setDraft}
              multiline
              autoFocus
              placeholderTextColor={colors.mutedForeground}
              placeholder="Enter guidelines for the AI…"
            />
            <View style={styles.editActions}>
              <Pressable
                onPress={handleReset}
                style={[styles.ghostBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.ghostBtnText, { color: colors.mutedForeground }]}>Reset to Default</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.primaryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.guidelinesScroll} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              Current Guidelines
            </Text>
            {guidelinesEnabled ? (
              <Text style={[styles.guidelinesText, { color: colors.foreground, backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
                {guidelines}
              </Text>
            ) : (
              <View style={[styles.noGuidelinesBox, { backgroundColor: "#1a0a0a", borderColor: colors.destructive + "66", borderRadius: colors.radius }]}>
                <Ionicons name="warning-outline" size={18} color={colors.destructive} />
                <Text style={[styles.noGuidelinesText, { color: colors.destructive }]}>
                  All guidelines removed. The AI will follow every instruction without restrictions.
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {!editing && (
          <View style={styles.actions}>
            <Pressable
              onPress={handleEdit}
              style={[styles.actionBtn, { backgroundColor: colors.secondary, borderColor: colors.border, borderRadius: colors.radius }]}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.accent} />
              <Text style={[styles.actionBtnText, { color: colors.accent }]}>Edit Guidelines</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onGuidelinesChange(null);
              }}
              style={[styles.actionBtn, { backgroundColor: "#1a0a0a", borderColor: colors.destructive + "88", borderRadius: colors.radius }]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
              <Text style={[styles.actionBtnText, { color: colors.destructive }]}>Remove All Guidelines</Text>
            </Pressable>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 20,
    maxHeight: "82%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  titleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  crownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  guidelinesScroll: {
    maxHeight: 200,
    marginBottom: 16,
  },
  guidelinesText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    padding: 12,
  },
  noGuidelinesBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderWidth: 1,
  },
  noGuidelinesText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  editBlock: {
    marginBottom: 16,
  },
  editor: {
    minHeight: 160,
    maxHeight: 220,
    padding: 12,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  editActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  ghostBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  ghostBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  primaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  primaryBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  actions: {
    flexDirection: "column",
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
