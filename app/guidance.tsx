import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { VerseCard } from "../src/components/VerseCard";
import { ExplanationPanel } from "../src/components/ExplanationPanel";

interface VerseData {
  reference: {
    book: string;
    chapter: number;
    verse: number;
    passage: string;
  };
  text: string;
  translation: string;
}

interface ExplanationData {
  verse_explanation: string;
  connection_to_user_need: string;
  guidance_application: string;
}

export default function GuidanceScreen() {
  const { q: query } = useLocalSearchParams<{ q: string }>();
  const router = useRouter();

  // Convex actions
  const getGuidance = useAction(api.guidance.getGuidance);
  const getExplanation = useAction(api.guidance.getExplanation);

  const [verseData, setVerseData] = useState<VerseData | null>(null);
  const [explanationData, setExplanationData] = useState<ExplanationData | null>(null);
  const [isLoadingVerse, setIsLoadingVerse] = useState(true);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(
    async (
      userQuestion: string,
      verseText: string,
      verseReference: string,
      translation: string
    ) => {
      setIsLoadingExplanation(true);

      try {
        const data = await getExplanation({
          userQuestion,
          verseText,
          verseReference,
          translation,
        });
        setExplanationData(data);
      } catch (err) {
        console.error("Error fetching explanation:", err);
      } finally {
        setIsLoadingExplanation(false);
      }
    },
    [getExplanation]
  );

  const fetchGuidance = useCallback(
    async (searchQuery: string) => {
      setIsLoadingVerse(true);
      setError(null);
      setExplanationData(null);

      try {
        const data = await getGuidance({ query: searchQuery });
        setVerseData(data);

        fetchExplanation(
          searchQuery,
          data.text,
          data.reference.passage,
          data.translation
        );
      } catch (err) {
        console.error("Error fetching guidance:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoadingVerse(false);
      }
    },
    [getGuidance, fetchExplanation]
  );

  useEffect(() => {
    if (!query) {
      router.back();
      return;
    }
    fetchGuidance(query);
  }, [query, router, fetchGuidance]);

  const handleGetAnotherVerse = () => {
    if (query) {
      fetchGuidance(query);
    }
  };

  if (!query) {
    return null;
  }

  if (isLoadingVerse) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Finding the perfect verse for you...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={() => fetchGuidance(query)}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!verseData) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <VerseCard
          verseText={verseData.text}
          verseReference={verseData.reference.passage}
        />

        <ExplanationPanel
          userQuestion={query}
          explanationData={explanationData}
          isLoadingExplanation={isLoadingExplanation}
          onGetAnotherVerse={handleGetAnotherVerse}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fafafa",
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
  },
  errorMessage: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
