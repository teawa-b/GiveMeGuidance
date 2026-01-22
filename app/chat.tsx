import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { getChat, getChatMessages, addChatMessage, createChat, resetChatMessages, type Chat, type ChatMessage } from "../src/services/chats";
import { sendChatMessage, type ChatContext } from "../src/services/chatAI";
import { useDataCache } from "../src/lib/DataCache";
import { ChatLoadingBubble } from "../src/components/ChatLoadingBubble";
import { lightHaptic, mediumHaptic } from "../src/lib/haptics";
import { EtherealBackground } from "../src/components/EtherealBackground";

// App logo for chat avatar
const appLogo = require("../assets/NewLogo.png");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  const flatListRef = useRef<FlatList>(null);
  
  // Get cache invalidation functions
  const { invalidateChats, invalidateStreak } = useDataCache();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(params.chatId || null);
  const [context, setContext] = useState<ChatContext | null>(null);

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);

      if (params.chatId) {
        // Loading existing chat
        const existingChat = await getChat(params.chatId);
        if (existingChat) {
          setChat(existingChat);
          setChatId(existingChat.id);
          setContext({
            verseText: existingChat.verse_text,
            verseReference: existingChat.verse_reference,
            userQuestion: existingChat.user_question,
            reflectionPrompt: existingChat.user_question, // The reflection question if any
            explanationData: existingChat.explanation_data,
          });

          // Load existing messages
          const existingMessages = await getChatMessages(existingChat.id);
          if (existingMessages.length > 0) {
            setMessages(existingMessages.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
            })));
          } else {
            // Add initial assistant message from explanation
            const initialMessage = formatInitialMessage(
              existingChat.explanation_data,
              existingChat.verse_text,
              existingChat.verse_reference
            );
            setMessages([{
              id: "initial",
              role: "assistant",
              content: initialMessage,
            }]);
          }
        }
      } else if (params.verseText && params.explanation) {
        // Creating new chat from verse with explanation
        const explanationData = JSON.parse(params.explanation);
        const originalQuestion = params.userQuestion?.trim() || "";
        const reflectionQuestion = params.reflectionPrompt?.trim() || "";
        
        const newContext: ChatContext = {
          verseText: params.verseText,
          verseReference: params.verseReference || "",
          userQuestion: originalQuestion, // Original question for chat title
          reflectionPrompt: reflectionQuestion, // The "Reflect Deeper" question for AI context
          explanationData,
        };
        setContext(newContext);

        // Create the chat in database
        try {
          const newChatId = await createChat(
            newContext.verseText,
            newContext.verseReference,
            originalQuestion, // Use original question for the chat title
            newContext.explanationData
          );
          setChatId(newChatId);
          
          // Invalidate cache so chats list refreshes when user goes back
          invalidateChats();
          invalidateStreak();

          // Add initial assistant message with verse and explanation
          const initialMessage = formatInitialMessage(
            explanationData,
            newContext.verseText,
            newContext.verseReference
          );
          
          const initialMessages: Message[] = [{
            id: "initial",
            role: "assistant",
            content: initialMessage,
          }];

          // Save initial message to database
          if (newChatId) {
            await addChatMessage(newChatId, "assistant", initialMessage);
          }

          // If there's a reflection prompt, add it as an ASSISTANT message (posing the question to the user)
          if (reflectionQuestion) {
            // Format the reflection question as an assistant message
            const reflectionMessage = `✨ **Reflect Deeper**\n\n${reflectionQuestion}`;
            
            // Add the reflection question as an assistant message
            initialMessages.push({
              id: "reflection-prompt",
              role: "assistant",
              content: reflectionMessage,
            });

            // Save reflection message to database
            if (newChatId) {
              await addChatMessage(newChatId, "assistant", reflectionMessage);
            }
          }

          setMessages(initialMessages);
        } catch (error) {
          console.error("Error creating chat:", error);
        }
      } else if (params.verseText && !params.explanation) {
        // Creating new chat from bookmark (no explanation data)
        const originalQuestion = params.userQuestion?.trim() || "Discuss this verse";
        
        // Create a minimal explanation for bookmarked verses
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

        // Create the chat in database
        try {
          const newChatId = await createChat(
            newContext.verseText,
            newContext.verseReference,
            originalQuestion,
            minimalExplanation
          );
          setChatId(newChatId);
          
          // Invalidate cache so chats list refreshes when user goes back
          invalidateChats();
          invalidateStreak();

          // Add initial assistant message for bookmarked verse
          const initialMessage = formatBookmarkChatMessage(
            newContext.verseText,
            newContext.verseReference
          );
          
          const initialMessages: Message[] = [{
            id: "initial",
            role: "assistant",
            content: initialMessage,
          }];

          // Save initial message to database
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
  }, [params.chatId, params.verseText, params.explanation, invalidateChats, invalidateStreak]);

  const formatInitialMessage = (explanationData: ChatContext["explanationData"], verseText?: string, verseRef?: string): string => {
    let message = "";
    
    // Include the verse at the top of the first message
    if (verseText && verseRef) {
      message += `📖 "${verseText}"\n— ${verseRef}\n\n`;
    }
    
    message += `📚 Understanding This Verse:\n${explanationData.verse_explanation}\n\n`;
    message += `💡 How This Speaks to You:\n${explanationData.connection_to_user_need}\n\n`;
    message += `🙏 Living It Out:\n${explanationData.guidance_application}\n\n`;
    message += `Feel free to ask me anything about this verse or how to apply it to your life!`;
    
    return message;
  };

  const formatBookmarkChatMessage = (verseText: string, verseRef: string): string => {
    let message = `📖 "${verseText}"\n— ${verseRef}\n\n`;
    message += `🍃 This verse is from your saved bookmarks. I'd love to help you explore its meaning and how it applies to your life.\n\n`;
    message += `Here are some things we could discuss:\n`;
    message += `• What this verse means in its original context\n`;
    message += `• How it speaks to your current situation\n`;
    message += `• Practical ways to apply its wisdom\n\n`;
    message += `What would you like to explore about this verse?`;
    
    return message;
  };

  // Reset the chat (keep initial messages only)
  const handleResetChat = useCallback(() => {
    if (!chatId) return;

    Alert.alert(
      "Reset Conversation",
      "This will clear all your messages and start fresh with the original guidance. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            mediumHaptic();
            try {
              // Determine how many initial messages to keep (1 for explanation, optionally 2 if there's a reflection)
              const keepCount = messages.length >= 2 && messages[1]?.content.includes("✨ **Reflect Deeper**") ? 2 : 1;
              
              await resetChatMessages(chatId, keepCount);
              
              // Update local state to show only initial messages
              setMessages(prev => prev.slice(0, keepCount));
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

    // Add user message to UI immediately
    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      role: "user",
      content: userMessage,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Save user message to database
      await addChatMessage(chatId, "user", userMessage);

      // Get AI response
      const previousMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      const aiResponse = await sendChatMessage(context, previousMessages, userMessage);

      // Add AI response to UI
      const aiMsgId = (Date.now() + 1).toString();
      const newAiMessage: Message = {
        id: aiMsgId,
        role: "assistant",
        content: aiResponse,
      };
      setMessages(prev => [...prev, newAiMessage]);

      // Save AI response to database
      await addChatMessage(chatId, "assistant", aiResponse);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm sorry, I couldn't process your message. Please try again.",
      }]);
    } finally {
      setIsSending(false);
    }
  }, [inputText, context, chatId, isSending, messages]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simple markdown text renderer
  const renderFormattedText = (text: string, isUser: boolean) => {
    // First, clean up HTML entities and tags
    let cleanedText = text
      // Handle line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/br>/gi, '\n')
      // Handle paragraph tags
      .replace(/<p>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      // Handle common HTML entities
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&apos;/gi, "'")
      // Handle bullet points that might come as HTML
      .replace(/<li>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/?ul>/gi, '\n')
      .replace(/<\/?ol>/gi, '\n')
      // Handle bold/strong tags
      .replace(/<strong>/gi, '**')
      .replace(/<\/strong>/gi, '**')
      .replace(/<b>/gi, '**')
      .replace(/<\/b>/gi, '**')
      // Handle italic/em tags
      .replace(/<em>/gi, '*')
      .replace(/<\/em>/gi, '*')
      .replace(/<i>/gi, '*')
      .replace(/<\/i>/gi, '*')
      // Remove any other HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Split by paragraphs (double newlines)
    const paragraphs = cleanedText.split(/\n\n+/);
    
    return paragraphs.map((paragraph, pIndex) => {
      // Split by single newlines within paragraph
      const lines = paragraph.split(/\n/);
      
      return (
        <Text key={pIndex} style={[styles.messageText, isUser && styles.userText, pIndex > 0 && styles.paragraphSpacing]}>
          {lines.map((line, lIndex) => {
            // Parse the line for bold and italic
            const parts: React.ReactNode[] = [];
            let keyIndex = 0;
            
            // Pattern for **bold**, *italic*, and 📖📚💡🙏 emojis (already render fine)
            const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
            let lastIndex = 0;
            let match;
            
            while ((match = regex.exec(line)) !== null) {
              // Add text before the match
              if (match.index > lastIndex) {
                parts.push(line.substring(lastIndex, match.index));
              }
              
              if (match[2]) {
                // Bold text (**text**)
                parts.push(
                  <Text key={keyIndex++} style={styles.boldText}>{match[2]}</Text>
                );
              } else if (match[3]) {
                // Italic text (*text*)
                parts.push(
                  <Text key={keyIndex++} style={styles.italicText}>{match[3]}</Text>
                );
              }
              
              lastIndex = regex.lastIndex;
            }
            
            // Add remaining text
            if (lastIndex < line.length) {
              parts.push(line.substring(lastIndex));
            }
            
            // If no formatting found, just return the line
            if (parts.length === 0) {
              parts.push(line);
            }
            
            return (
              <React.Fragment key={lIndex}>
                {parts}
                {lIndex < lines.length - 1 && '\n'}
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
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Image source={appLogo} style={styles.avatarImage} resizeMode="contain" />
          </View>
        )}
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.assistantContent]}>
          {renderFormattedText(item.content, isUser)}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <EtherealBackground />
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: context?.verseReference || "Chat",
          headerBackTitle: "Back",
          headerTintColor: "#10b981",
          headerStyle: { backgroundColor: "#fafaf6" },
          headerTitleStyle: { fontWeight: "600", fontSize: 17 },
          headerShadowVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Pressable
                onPress={handleResetChat}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: 8,
                })}
              >
                <Ionicons name="refresh" size={22} color="#10b981" />
              </Pressable>
              <Pressable
                onPress={() => router.replace("/(tabs)")}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.6 : 1,
                  padding: 8,
                  marginRight: 4,
                })}
              >
                <Ionicons name="home-outline" size={22} color="#10b981" />
              </Pressable>
            </View>
          ),
        }}
      />
      <View style={styles.container}>
        <EtherealBackground />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
        >
          {/* Messages */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            ListFooterComponent={isSending ? <ChatLoadingBubble /> : null}
            keyboardShouldPersistTaps="handled"
          />

          {/* Input Area */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about this verse..."
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={1000}
                editable={!isSending}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.sendButton,
                  (!inputText.trim() || isSending) && styles.sendButtonDisabled,
                  pressed && inputText.trim() && !isSending && styles.sendButtonPressed
                ]}
                onPress={handleSend}
                disabled={!inputText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <Ionicons 
                    name="arrow-up" 
                    size={20} 
                    color={inputText.trim() ? "#ffffff" : "#94a3b8"} 
                  />
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
    backgroundColor: "#fafaf6",
  },
  keyboardView: {
    flex: 1,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fafaf6",
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 3,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.1)",
      },
    }),
  },
  loadingText: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
  },
  
  // Messages
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  userBubble: {
    justifyContent: "flex-end",
  },
  assistantBubble: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.4)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 2px 6px rgba(16, 185, 129, 0.08)",
      },
    }),
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  messageContent: {
    maxWidth: "78%",
    padding: 14,
    borderRadius: 20,
  },
  userContent: {
    backgroundColor: "#10b981",
    borderBottomRightRadius: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
      },
    }),
  },
  assistantContent: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(236, 253, 245, 0.8)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 1,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
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
    marginTop: 12,
  },
  
  // Input area
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 28,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(167, 243, 208, 0.3)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 2px 10px rgba(16, 185, 129, 0.06)",
      },
    }),
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    color: "#1e293b",
    paddingTop: Platform.OS === "ios" ? 10 : 8,
    paddingBottom: Platform.OS === "ios" ? 10 : 8,
    backgroundColor: "transparent",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "transparent",
  },
  sendButtonPressed: {
    backgroundColor: "#059669",
    transform: [{ scale: 0.95 }],
  },
});
