import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface VerseCardProps {
  verseText: string;
  verseReference: string;
}

export function VerseCard({ verseText, verseReference }: VerseCardProps) {
  const isBookmarkedQuery = useQuery(api.bookmarks.isBookmarked, { verseReference });
  const addBookmark = useMutation(api.bookmarks.addBookmark);
  const [isBookmarking, setIsBookmarking] = useState(false);

  const bookmarked = isBookmarkedQuery ?? false;

  const handleToggleBookmark = async () => {
    if (isBookmarking || bookmarked) return; // Don't allow unbookmarking from here, only from bookmarks screen
    
    setIsBookmarking(true);
    try {
      await addBookmark({ verseText, verseReference });
    } catch (error) {
      console.error("Error bookmarking verse:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.textContainer}>
          <Text style={styles.verseText}>"{verseText}"</Text>
          <Text style={styles.reference}>— {verseReference}</Text>
        </View>
        <Pressable
          style={styles.bookmarkButton}
          onPress={handleToggleBookmark}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={bookmarked ? "#10b981" : "#9ca3af"}
          />
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  textContainer: {
    flex: 1,
    gap: 12,
  },
  verseText: {
    fontSize: 22,
    fontStyle: "italic",
    lineHeight: 32,
    color: "#111827",
  },
  reference: {
    fontSize: 16,
    fontWeight: "500",
    color: "#10b981",
  },
  bookmarkButton: {
    padding: 8,
    marginLeft: 8,
    marginTop: -4,
  },
});
