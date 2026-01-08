<<<<<<< Updated upstream
"use client"

import { useState, useEffect, useRef, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { InterstitialAd } from "@/components/ads"
=======
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
>>>>>>> Stashed changes

const placeholderPrompts = [
  "I'm feeling anxious about the future...",
  "I need direction in my career...",
  "I'm struggling with forgiveness...",
  "How do I find peace in hard times?",
  "I feel lost and need hope...",
  "Help me overcome my fears...",
  "I'm dealing with grief and loss...",
  "How can I strengthen my faith?",
];

<<<<<<< Updated upstream
export function SearchBar() {
  const [query, setQuery] = useState("")
  const [placeholder, setPlaceholder] = useState("")
  const [promptIndex, setPromptIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(true)
  const [isFocused, setIsFocused] = useState(false)
  const [showInterstitial, setShowInterstitial] = useState(false)
  const [pendingQuery, setPendingQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
=======
interface SearchBarProps {
  onSubmit: (query: string) => void;
}

export function SearchBar({ onSubmit }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
>>>>>>> Stashed changes

  // Typewriter effect
  useEffect(() => {
    if (isFocused || query) return;

    const currentPrompt = placeholderPrompts[promptIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (isTyping) {
      if (placeholderText.length < currentPrompt.length) {
        timeout = setTimeout(() => {
          setPlaceholderText(currentPrompt.slice(0, placeholderText.length + 1));
        }, 60);
      } else {
        timeout = setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    } else {
      if (placeholderText.length > 0) {
        timeout = setTimeout(() => {
          setPlaceholderText(placeholderText.slice(0, -1));
        }, 30);
      } else {
        setPromptIndex((prev) => (prev + 1) % placeholderPrompts.length);
        setIsTyping(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [placeholderText, isTyping, promptIndex, isFocused, query]);

  useEffect(() => {
    if (!isFocused && !query) {
      setPlaceholderText("");
      setIsTyping(true);
    }
  }, [isFocused, query]);

  const handleSubmit = () => {
    if (query.trim()) {
<<<<<<< Updated upstream
      // Show interstitial ad before navigating
      setPendingQuery(query.trim())
      setShowInterstitial(true)
    }
  }

  const handleInterstitialClose = () => {
    setShowInterstitial(false)
    if (pendingQuery) {
      router.push(`/guidance?q=${encodeURIComponent(pendingQuery)}`)
      setPendingQuery("")
=======
      onSubmit(query.trim());
>>>>>>> Stashed changes
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: 1.02,
      useNativeDriver: true,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          isFocused && styles.containerFocused,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Search input row */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={isFocused ? "#10b981" : "#9ca3af"}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder={isFocused ? "Share what's on your heart..." : placeholderText}
            placeholderTextColor="#9ca3af"
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            multiline={false}
          />
          {query.length > 0 && (
            <Pressable style={styles.clearButton} onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </Pressable>
          )}
        </View>

<<<<<<< Updated upstream
      {/* Helper text */}
      <p className="text-center text-xs text-muted-foreground/60 sm:text-sm">
        Press Enter to submit • Your questions are private
      </p>

      {/* Interstitial Ad */}
      <InterstitialAd
        adSlot="YOUR_INTERSTITIAL_AD_SLOT_ID"
        isOpen={showInterstitial}
        onClose={handleInterstitialClose}
        countdownSeconds={5}
      />
    </form>
  )
=======
        {/* Submit button inside card */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.submitButton, !query.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!query.trim()}
          >
            <Text style={styles.submitButtonText}>Get Guidance</Text>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
>>>>>>> Stashed changes
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    maxWidth: 500,
    gap: 14,
  },
  container: {
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    paddingBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      },
    }),
  },
  containerFocused: {
    borderColor: "#10b981",
    ...Platform.select({
      ios: {
        shadowOpacity: 0.12,
      },
      web: {
        boxShadow: "0 4px 20px rgba(16, 185, 129, 0.15)",
      },
    }),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  buttonContainer: {
    paddingHorizontal: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10b981",
    paddingVertical: 14,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 3px 8px rgba(16, 185, 129, 0.25)",
      },
    }),
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  helperText: {
    textAlign: "center",
    fontSize: 13,
    color: "#9ca3af",
  },
});
