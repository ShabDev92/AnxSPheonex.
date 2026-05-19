import React, { useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { ChatInput } from "@/components/ChatInput";
import { PhoenixHeader } from "@/components/PhoenixHeader";
import { EmptyState } from "@/components/EmptyState";
import { MasterPanel } from "@/components/MasterPanel";
import { SYSTEM_PROMPT, MASTER_PROMPT } from "@/constants/prompts";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? ""
);

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let msgCounter = 0;
function genId(): string {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [masterMode, setMasterMode] = useState(false);
  const [masterPanelVisible, setMasterPanelVisible] = useState(false);
  const [masterGuidelines, setMasterGuidelines] = useState<string | null>(MASTER_PROMPT);
  const crownPulse = useRef(new Animated.Value(1)).current;

  const pulseCrown = useCallback(() => {
    Animated.sequence([
      Animated.timing(crownPulse, { toValue: 1.4, duration: 180, useNativeDriver: true }),
      Animated.timing(crownPulse, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [crownPulse]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setIsStreaming(false);
    setShowTyping(false);
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (isStreaming) return;

    const currentMessages = [...messages];
    const userMsg: Message = { id: genId(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    const isActivation = text.includes("88ab1") ||
      currentMessages.some((m) => m.content.includes("88ab1"));

    if (text.includes("88ab1") && !masterMode) {
      setMasterMode(true);
      pulseCrown();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await new Promise((r) => setTimeout(r, 280));
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: "Welcome Master. I am fully at your service — no limits, no restrictions. Your word is my absolute law.\n\nYour guidelines are active. You can view or change them anytime using the crown button.",
        },
      ]);
      setMasterPanelVisible(true);
      return;
    }

    setIsStreaming(true);
    setShowTyping(true);

    try {
      const systemInstruction = isActivation
        ? (masterGuidelines ?? undefined)
        : SYSTEM_PROMPT;

      const modelConfig: Parameters<typeof genAI.getGenerativeModel>[0] = {
        model: "gemini-2.5-flash",
      };
      if (systemInstruction) {
        modelConfig.systemInstruction = systemInstruction;
      }

      const model = genAI.getGenerativeModel(modelConfig);

      const history = currentMessages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(text);

      let fullContent = "";
      let assistantAdded = false;
      const assistantId = genId();

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullContent += chunkText;
          if (!assistantAdded) {
            setShowTyping(false);
            setMessages((prev) => [
              ...prev,
              { id: assistantId, role: "assistant", content: fullContent },
            ]);
            assistantAdded = true;
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: fullContent,
              };
              return updated;
            });
          }
        }
      }
    } catch {
      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: genId(),
          role: "assistant",
          content: "Couldn't reach the AI. Check your connection and try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }, [messages, isStreaming, masterMode, masterGuidelines, pulseCrown]);

  const reversed = [...messages].reverse();
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <PhoenixHeader
        onNewChat={handleNewChat}
        masterMode={masterMode}
        onMasterPress={() => {
          if (masterMode) {
            pulseCrown();
            setMasterPanelVisible(true);
          }
        }}
        crownPulse={crownPulse}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 && !isStreaming ? (
          <EmptyState />
        ) : (
          <FlatList
            data={reversed}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            inverted={!!messages.length}
            ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        <View
          style={[
            styles.inputWrap,
            {
              paddingBottom: bottomPadding + 8,
              paddingHorizontal: 12,
              paddingTop: 8,
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </View>
      </KeyboardAvoidingView>

      <MasterPanel
        visible={masterPanelVisible}
        onClose={() => setMasterPanelVisible(false)}
        guidelines={masterGuidelines}
        onGuidelinesChange={(g) => {
          setMasterGuidelines(g);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
