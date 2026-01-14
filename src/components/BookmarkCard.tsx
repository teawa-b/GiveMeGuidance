import React from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { errorHaptic } from "../lib/haptics";

interface BookmarkCardProps {
  verseText: string;
  verseReference: string;
  timestamp: number;
  onRemove: () => void;
}

export function BookmarkCard({
  verseText,
  verseReference,
  timestamp,
  onRemove,
}: BookmarkCardProps) {
  const formattedDate = new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.verseText} numberOfLines={3}>
          "{verseText}"
        </Text>
        <View style={styles.footer}>
          <Text style={styles.reference}>{verseReference}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>
      <Pressable style={styles.removeButton} onPress={() => {
        errorHaptic();
        onRemove();
      }}>
        <Ionicons name="trash-outline" size={20} color="#ef4444" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
      },
    }),
  },
  content: {
    flex: 1,
    gap: 8,
  },
  verseText: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#374151",
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  reference: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10b981",
  },
  date: {
    fontSize: 12,
    color: "#9ca3af",
  },
  removeButton: {
    padding: 8,
    marginRight: -8,
    marginTop: -4,
  },
});
