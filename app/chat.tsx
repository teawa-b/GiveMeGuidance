import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getChat, getChatMessages, addChatMessage, createChat, resetChatMessages } from "../src/services/chats";
import { sendChatMessage, type ChatContext } from "../src/services/chatAI";
import { useDataCache } from "../src/lib/DataCache";
import { ChatLoadingBubble } from "../src/components/ChatLoadingBubble";
import { lightHaptic, mediumHaptic } from "../src/lib/haptics";
import { EtherealBackground } from "../src/components/EtherealBackground";

const appLogo = require("../assets/mascot/bird-reading.png");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INPUT_MAX_LENGTH = 1000;

const GENERIC_QUESTIONS = new Set([
  "reflect on this verse",
  "discuss this verse",
  "daily guidance",
]);

function isGenericQuestion(question: string): boolean {
  return GENERIC_QUESTIONS.has(question.toLowerCase().trim());
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    chatId?: string;
    verseText?: string;
    verseReference?: string;
    userQuestion?: string;
    reflectionPrompt?: string;
    explanation?: string;
  }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList<Message>>(null);

  const { invalidateChats, invalidateStreak } = useDataCache();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(params.chatId || null);
  const [context, setContext] = useState<ChatContext | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);

      if (params.chatId) {
        const existingChat = await getChat(params.chatId);
        if (existingChat) {
          setChatId(existingChat.id);
          setContext({
            verseText: existingChat.verse_text,
            verseReference: existingChat.verse_reference,
            userQuestion: existingChat.user_question,
            reflectionPrompt: existingChat.user_question,
            explanationData: existingChat.explanation_data,
          });

          const existingMessages = await getChatMessages(existingChat.id);
          if (existingMessages.length > 0) {
            setMessages(
              existingMessages.map((message) => ({
                id: message.id,
                role: message.role,
                content: message.content,
              }))
            );
          } else {
            const initialMessage = formatInitialMessage(
              existingChat.explanation_data,
              existingChat.verse_text,
              existingChat.verse_reference
            );
            setMessages([
              {
                id: "initial",
                role: "assistant",
                content: initialMessage,
              },
            ]);
          }
        }
      } else if (params.verseText && params.explanation) {
        let explanationData: ChatContext["explanationData"] | null = null;
        try {
          explanationData = JSON.parse(params.explanation);
        } catch (error) {
          console.error("Error parsing chat explanation data:", error);
        }

        if (!explanationData) {
          setIsLoading(false);
          return;
        }

        const originalQuestion = params.userQuestion?.trim() || "";
        const reflectionQuestion = params.reflectionPrompt?.trim() || "";

        const newContext: ChatContext = {
          verseText: params.verseText,
          verseReference: params.verseReference || "",
          userQuestion: originalQuestion,
          reflectionPrompt: reflectionQuestion,
          explanationData,
        };
        setContext(newContext);

        try {
          const newChatId = await createChat(
            newContext.verseText,
            newContext.verseReference,
            originalQuestion,
            newContext.explanationData
          );
          setChatId(newChatId);

          invalidateChats();
          invalidateStreak();

          const initialMessage = formatInitialMessage(
            explanationData,
            newContext.verseText,
            newContext.verseReference
          );

          const initialMessages: Message[] = [
            {
              id: "initial",
              role: "assistant",
              content: initialMessage,
            },
          ];

          if (newChatId) {
            await addChatMessage(newChatId, "assistant", initialMessage);
          }

          if (reflectionQuestion) {
            const reflectionMessage = `**Reflect Deeper**\n\n${reflectionQuestion}`;

            initialMessages.push({
              id: "reflection-prompt",
              role: "assistant",
              content: reflectionMessage,
            });

            if (newChatId) {
              await addChatMessage(newChatId, "assistant", reflectionMessage);
            }
          }

          setMessages(initialMessages);
        } catch (error) {
          console.error("Error creating chat:", error);
        }
      } else if (params.verseText && !params.explanation) {
        const originalQuestion = params.userQuestion?.trim() || params.verseReference || "Discuss this verse";

        const minimalExplanation = {
          verse_explanation: "This verse from Scripture offers wisdom and guidance for your life.",
          connection_to_user_need: "Take a moment to reflect on how this verse speaks to your current situation.",
          guidance_application: "Consider how you might apply the wisdom of this verse in your daily life.",
        };

        const newContext: ChatContext = {
          verseText: params.verseText,
          verseReference: params.verseReference || "",
          userQuestion: originalQuestion,
          explanationData: minimalExplanation,
        };
        setContext(newContext);

        try {
          const newChatId = await createChat(
            newContext.verseText,
            newContext.verseReference,
            originalQuestion,
            minimalExplanation
          );
          setChatId(newChatId);

          invalidateChats();
          invalidateStreak();

          const initialMessage = formatBookmarkChatMessage(newContext.verseText, newContext.verseReference);

          const initialMessages: Message[] = [
            {
              id: "initial",
              role: "assistant",
              content: initialMessage,
            },
          ];

          if (newChatId) {
            await addChatMessage(newChatId, "assistant", initialMessage);
          }

          setMessages(initialMessages);
        } catch (error) {
          console.error("Error creating chat from bookmark:", error);
        }
      }

      setIsLoading(false);
    };

    initializeChat();
  }, [
    params.chatId,
    params.verseText,
    params.verseReference,
    params.userQuestion,
    params.reflectionPrompt,
    params.explanation,
    invalidateChats,
    invalidateStreak,
  ]);

  const formatInitialMessage = (
    explanationData: ChatContext["explanationData"],
    verseText?: string,
    verseReference?: string
  ): string => {
    let message = "";

    if (verseText && verseReference) {
      message += `"${verseText}"\n- ${verseReference}\n\n`;
    }

    message += "**Understanding This Verse**\n";
    message += `${explanationData.verse_explanation}\n\n`;
    message += "**How This Speaks to You**\n";
    message += `${explanationData.connection_to_user_need}\n\n`;
    message += "**Living It Out**\n";
    message += `${explanationData.guidance_application}\n\n`;
    message += "Ask me anything about this verse and how to live it today.";

    return message;
  };

  const formatBookmarkChatMessage = (verseText: string, verseReference: string): string => {
    let message = `"${verseText}"\n- ${verseReference}\n\n`;
    message += "This verse is from your saved bookmarks. We can explore it together.\n\n";
    message += "Possible directions:\n";
    message += "- The original context and meaning\n";
    message += "- How it connects to your current season\n";
    message += "- Practical steps to apply today\n\n";
    message += "What would you like to explore first?";

    return message;
  };

  const handleResetChat = useCallback(() => {
    if (!chatId) return;

    Alert.alert(
      "Reset Conversation",
      "This will clear your newer messages and keep the original guidance. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            mediumHaptic();
            try {
              const secondMessage = messages[1]?.content?.toLowerCase() || "";
              const keepCount = secondMessage.includes("reflect deeper") ? 2 : 1;
              await resetChatMessages(chatId, keepCount);
              setMessages((previous) => previous.slice(0, keepCount));
            } catch (error) {
              console.error("Error resetting chat:", error);
              Alert.alert("Error", "Failed to reset conversation. Please try again.");
            }
          },
        },
      ]
    );
  }, [chatId, messages]);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !context || !chatId || isSending) return;

    lightHaptic();
    const userMessage = inputText.trim();
    setInputText("");
    setIsSending(true);

    const userMessageId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMessageId,
      role: "user",
      content: userMessage,
    };
    setMessages((previous) => [...previous, newUserMessage]);

    try {
      await addChatMessage(chatId, "user", userMessage);

      const previousMessages = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const aiResponse = await sendChatMessage(context, previousMessages, userMessage);

      const aiMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: aiResponse,
      };
      setMessages((previous) => [...previous, assistantMessage]);

      await addChatMessage(chatId, "assistant", aiResponse);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((previous) => [
        ...previous,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: "I could not process that message. Please try again.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }, [inputText, context, chatId, isSending, messages]);

  const allQuickPrompts = useMemo(() => {
    const prompts = [
      context?.reflectionPrompt?.trim(),
      "How can I apply this verse today?",
      "What should I pray about from this?",
      "What is the historical context?",
      "How does this connect to other scriptures?",
      "What does this mean for my relationships?",
      "Can you break this verse down word by word?",
      "What comfort does this verse offer?",
      "How can this guide my decisions today?",
    ].filter((prompt): prompt is string => Boolean(prompt && prompt.length > 0));

    return Array.from(new Set(prompts));
  }, [context?.reflectionPrompt]);

  const PROMPTS_PER_PAGE = 2;
  const totalPages = Math.max(1, Math.ceil(allQuickPrompts.length / PROMPTS_PER_PAGE));
  const [promptPage] = useState(() => Math.floor(Math.random() * totalPages));

  const hasUserMessage = useMemo(
    () => messages.some((m) => m.role === "user"),
    [messages]
  );

  const visiblePrompts = useMemo(() => {
    const start = promptPage * PROMPTS_PER_PAGE;
    return allQuickPrompts.slice(start, start + PROMPTS_PER_PAGE);
  }, [allQuickPrompts, promptPage]);

  const handleQuickPrompt = useCallback((prompt: string) => {
    lightHaptic();
    setInputText(prompt);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!flatListRef.current || messages.length === 0) return;
    flatListRef.current.scrollToEnd({ animated: true });
  }, [messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const renderFormattedText = (text: string, isUser: boolean) => {
    const cleanedText = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/br>/gi, "\n")
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      .replace(/<li>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/?ul>/gi, "\n")
      .replace(/<\/?ol>/gi, "\n")
      .replace(/<strong>/gi, "**")
      .replace(/<\/strong>/gi, "**")
      .replace(/<b>/gi, "**")
      .replace(/<\/b>/gi, "**")
      .replace(/<em>/gi, "*")
      .replace(/<\/em>/gi, "*")
      .replace(/<i>/gi, "*")
      .replace(/<\/i>/gi, "*")
      .replace(/<[^>]*>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const paragraphs = cleanedText.split(/\n\n+/);
    return paragraphs.map((paragraph, paragraphIndex) => {
      const lines = paragraph.split(/\n/);
      return (
        <Text
          key={`paragraph-${paragraphIndex}`}
          style={[
            styles.messageText,
            isUser && styles.userText,
            paragraphIndex > 0 && styles.paragraphSpacing,
          ]}
        >
          {lines.map((line, lineIndex) => {
            const parts: React.ReactNode[] = [];
            const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
            let lastIndex = 0;
            let token;
            let partIndex = 0;

            while ((token = regex.exec(line)) !== null) {
              if (token.index > lastIndex) {
                parts.push(line.substring(lastIndex, token.index));
              }

              if (token[2]) {
                parts.push(
                  <Text key={`bold-${lineIndex}-${partIndex}`} style={styles.boldText}>
                    {token[2]}
                  </Text>
                );
                partIndex += 1;
              } else if (token[3]) {
                parts.push(
                  <Text key={`italic-${lineIndex}-${partIndex}`} style={styles.italicText}>
                    {token[3]}
                  </Text>
                );
                partIndex += 1;
              }

              lastIndex = regex.lastIndex;
            }

            if (lastIndex < line.length) {
              parts.push(line.substring(lastIndex));
            }

            if (parts.length === 0) {
              parts.push(line);
            }

            return (
              <React.Fragment key={`line-${lineIndex}`}>
                {parts}
                {lineIndex < lines.length - 1 && "\n"}
              </React.Fragment>
            );
          })}
        </Text>
      );
    });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Image source={appLogo} style={styles.avatarImage} resizeMode="contain" />
          </View>
        )}

        <View style={[styles.messageColumn, isUser && styles.userMessageColumn]}>
          <Text style={[styles.speakerLabel, isUser ? styles.userSpeakerLabel : styles.assistantSpeakerLabel]}>
            {isUser ? "You" : "Guide"}
          </Text>

          {isUser ? (
            <LinearGradient
              colors={["#22c58b", "#10b981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.messageBubble, styles.userBubble]}
            >
              {renderFormattedText(item.content, true)}
            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              {renderFormattedText(item.content, false)}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <EtherealBackground variant="chat" intensity="low" />
        <View style={styles.loadingPanel}>
          <Image source={appLogo} style={styles.loadingBird} resizeMode="contain" />
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={styles.loadingText}>Preparing your conversation...</Text>
        </View>
      </View>
    );
  }

  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: context?.verseReference || "Guided Chat",
          headerBackTitle: "Back",
          headerTintColor: "#0f766e",
          headerStyle: { backgroundColor: "#f1fbf3" },
          headerTitleStyle: { fontWeight: "600", fontSize: 16, color: "#065f46" },
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [styles.headerActionButton, pressed && styles.headerActionButtonPressed]}
                onPress={handleResetChat}
              >
                <Ionicons name="refresh" size={18} color="#0f766e" />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.headerActionButton, pressed && styles.headerActionButtonPressed]}
                onPress={() => router.replace("/(tabs)")}
              >
                <Ionicons name="home-outline" size={18} color="#0f766e" />
              </Pressable>
            </View>
          ),
        }}
      />

      <View style={styles.container}>
        <EtherealBackground variant="chat" intensity="low" />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 16}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              context ? (
                <View style={styles.contextCard}>
                  <LinearGradient
                    colors={["rgba(214, 249, 228, 0.9)", "rgba(236, 253, 245, 0.95)", "rgba(255, 255, 255, 0.95)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.contextCardGradient}
                  >
                    <Text style={styles.contextLabel}>CONVERSATION FOCUS</Text>
                    <Text style={styles.contextReference}>{context.verseReference}</Text>
                    <Text style={styles.contextVerseText} numberOfLines={3}>
                      "{context.verseText}"
                    </Text>

                    {!!context.userQuestion && !isGenericQuestion(context.userQuestion) && (
                      <View style={styles.contextQuestionRow}>
                        <Ionicons name="sparkles-outline" size={14} color="#0f766e" />
                        <Text style={styles.contextQuestionText} numberOfLines={2}>
                          {context.userQuestion}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Start the conversation</Text>
                <Text style={styles.emptySubtitle}>Ask what this verse means for your day.</Text>
              </View>
            }
            ListFooterComponent={isSending ? <ChatLoadingBubble /> : <View style={styles.footerSpacer} />}
          />

          <View style={styles.composerSection}>
            {!hasUserMessage && visiblePrompts.length > 0 && (
              <View style={styles.quickPromptRow}>
                {visiblePrompts.map((prompt) => (
                  <Pressable
                    key={prompt}
                    style={({ pressed }) => [
                      styles.quickPromptChip,
                      pressed && styles.quickPromptChipPressed,
                    ]}
                    onPress={() => handleQuickPrompt(prompt)}
                  >
                    <Text style={styles.quickPromptText} numberOfLines={1}>
                      {prompt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.inputShell}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about this verse..."
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={INPUT_MAX_LENGTH}
                editable={!isSending}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.sendButton,
                  !canSend && styles.sendButtonDisabled,
                  pressed && canSend && styles.sendButtonPressed,
                ]}
                onPress={handleSend}
                disabled={!canSend}
              >
                {isSending ? (
                  <View style={styles.sendButtonGradient}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                ) : canSend ? (
                  <LinearGradient
                    colors={["#22c58b", "#10b981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendButtonGradient}
                  >
                    <Ionicons name="arrow-up" size={18} color="#ffffff" />
                  </LinearGradient>
                ) : (
                  <Ionicons name="arrow-up" size={18} color="#94a3b8" />
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fcf8",
  },
  keyboardView: {
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      },
      android: {
        backgroundColor: "#ffffff",
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
      },
    }),
  },
  headerActionButtonPressed: {
    opacity: 0.78,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f1fbf4",
  },
  loadingPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingBird: {
    width: 74,
    height: 74,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748b",
  },
  messagesList: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
  },
  contextCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 6px 16px rgba(5, 150, 105, 0.12)",
      },
    }),
  },
  contextCardGradient: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  contextLabel: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "700",
    color: "#0f766e",
    marginBottom: 6,
  },
  contextReference: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#14532d",
    marginBottom: 8,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" }),
  },
  contextVerseText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#065f46",
    fontStyle: "italic",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", web: "Georgia, serif" }),
  },
  contextQuestionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(15, 118, 110, 0.15)",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  contextQuestionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: "#0f766e",
    fontWeight: "500",
  },
  emptyState: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748b",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 14,
    alignItems: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.5)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 1,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.1)",
      },
    }),
  },
  avatarImage: {
    width: 30,
    height: 30,
    margin: 3,
  },
  messageColumn: {
    maxWidth: "84%",
  },
  userMessageColumn: {
    alignItems: "flex-end",
  },
  speakerLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  assistantSpeakerLabel: {
    color: "#0f766e",
    marginLeft: 2,
  },
  userSpeakerLabel: {
    color: "#047857",
    marginRight: 2,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assistantBubble: {
    borderRadius: 22,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.14)",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
      },
    }),
  },
  userBubble: {
    borderRadius: 22,
    borderBottomRightRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#059669",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 3px 8px rgba(5, 150, 105, 0.2)",
      },
    }),
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#1e293b",
  },
  userText: {
    color: "#ffffff",
  },
  boldText: {
    fontWeight: "700",
  },
  italicText: {
    fontStyle: "italic",
  },
  paragraphSpacing: {
    marginTop: 10,
  },
  footerSpacer: {
    height: 18,
  },
  composerSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(16, 185, 129, 0.12)",
    backgroundColor: "rgba(247, 252, 248, 0.95)",
  },
  quickPromptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  quickPromptChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    maxWidth: "100%",
  },
  quickPromptChipPressed: {
    backgroundColor: "rgba(220, 252, 231, 0.95)",
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.09,
        shadowRadius: 10,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 2px 10px rgba(16, 185, 129, 0.09)",
      },
    }),
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 112,
    fontSize: 16,
    lineHeight: 22,
    color: "#1e293b",
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
  },
  sendButtonDisabled: {
    backgroundColor: "rgba(226, 232, 240, 0.8)",
  },
  sendButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
});
