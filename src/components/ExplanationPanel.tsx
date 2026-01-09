import React from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ExplanationData {
  verse_explanation: string;
  connection_to_user_need: string;
  guidance_application: string;
}

interface ExplanationPanelProps {
  userQuestion: string;
  explanationData: ExplanationData | null;
  isLoadingExplanation: boolean;
  onAskFollowUp?: () => void;
  onGetAnotherVerse: () => void;
}

export function ExplanationPanel({
  userQuestion,
  explanationData,
  isLoadingExplanation,
  onAskFollowUp,
  onGetAnotherVerse,
}: ExplanationPanelProps) {
  return (
    <View style={styles.container}>
      {/* User's original question */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your question</Text>
        <Text style={styles.questionText}>{userQuestion}</Text>
      </View>

      <View style={styles.divider} />

      {/* AI Explanation */}
      {isLoadingExplanation ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Preparing your guidance...</Text>
        </View>
      ) : explanationData ? (
        <View style={styles.explanationContent}>
          {/* Verse Explanation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Understanding This Verse</Text>
            <Text style={styles.sectionBody}>{explanationData.verse_explanation}</Text>
          </View>

          {/* Connection to User's Need */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How This Speaks to You</Text>
            <Text style={styles.sectionBody}>
              {explanationData.connection_to_user_need}
            </Text>
          </View>

          {/* Guidance/Application */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Living It Out</Text>
            <Text style={styles.sectionBody}>
              {explanationData.guidance_application}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Unable to load explanation. Please try again.
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsContainer}>
        <Pressable
          style={styles.actionButton}
          onPress={onGetAnotherVerse}
          disabled={isLoadingExplanation}
        >
          <Ionicons name="refresh" size={18} color="#10b981" />
          <Text style={styles.actionButtonText}>Give me another verse</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.05)",
      },
    }),
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  explanationContent: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  sectionBody: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 24,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  errorText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#10b981",
  },
});
