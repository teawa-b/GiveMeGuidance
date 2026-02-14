import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { errorHaptic, lightHaptic, successHaptic } from "../lib/haptics";
import { ShareableVerseCard } from "./ShareableVerseCard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { capitalizeFirstLetter } from "../lib/textUtils";

// Conditionally import ViewShot - it may not be available in dev builds
let ViewShot: any = null;
try {
  ViewShot = require("react-native-view-shot").default;
} catch (e) {
  console.warn("react-native-view-shot not available:", e);
}

interface BookmarkCardProps {
  verseText: string;
  verseReference: string;
  timestamp: number;
  onRemove: () => void;
  onOpenVerse?: () => void;
  onChat?: () => void;
}

export function BookmarkCard({
  verseText,
  verseReference,
  timestamp,
  onRemove,
  onOpenVerse,
  onChat,
}: BookmarkCardProps) {
  const viewShotRef = useRef<any>(null);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const formattedDate = new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handleShare = async () => {
    lightHaptic();
    setShowSharePreview(true);
  };

  const handleCaptureAndShare = async () => {
    if (!ViewShot || !viewShotRef.current?.capture) {
      console.warn("ViewShot not available for sharing");
      setShowSharePreview(false);
      return;
    }
    
    setIsSharing(true);
    try {
      // Capture the view as an image
      const uri = await viewShotRef.current.capture();
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share this verse",
        });
        successHaptic();
      } else {
        // Fallback for platforms without native sharing
        console.log("Sharing not available on this platform");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setIsSharing(false);
      setShowSharePreview(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.verseText} numberOfLines={3}>
            "{capitalizeFirstLetter(verseText)}"
          </Text>
          <View style={styles.footer}>
            <Text style={styles.reference}>{verseReference}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          
          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <Pressable 
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]} 
              onPress={() => {
                lightHaptic();
                onOpenVerse?.();
              }}
            >
              <Ionicons name="book-outline" size={16} color="#10b981" />
              <Text style={styles.actionButtonText}>Open</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]} 
              onPress={() => {
                lightHaptic();
                onChat?.();
              }}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#10b981" />
              <Text style={styles.actionButtonText}>Chat</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]} 
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={16} color="#10b981" />
              <Text style={styles.actionButtonText}>Share</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [styles.actionButton, styles.removeActionButton, pressed && styles.actionButtonPressed]} 
              onPress={() => {
                errorHaptic();
                onRemove();
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Share Preview Modal */}
      <Modal
        visible={showSharePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSharePreview(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowSharePreview(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Verse</Text>
            <Text style={styles.modalSubtitle}>Preview your shareable image</Text>
            
            {ViewShot ? (
              <ViewShot
                ref={viewShotRef}
                options={{ format: "png", quality: 1 }}
                style={styles.viewShotContainer}
              >
                <ShareableVerseCard
                  verseText={verseText}
                  verseReference={verseReference}
                />
              </ViewShot>
            ) : (
              <View style={styles.viewShotContainer}>
                <ShareableVerseCard
                  verseText={verseText}
                  verseReference={verseReference}
                />
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.cancelButton, pressed && { opacity: 0.7 }]}
                onPress={() => setShowSharePreview(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              
              <Pressable
                style={({ pressed }) => [styles.modalButton, styles.shareButton, pressed && { opacity: 0.7 }]}
                onPress={handleCaptureAndShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Text style={styles.shareButtonText}>Sharing...</Text>
                ) : (
                  <>
                    <Ionicons name="share-outline" size={18} color="#ffffff" />
                    <Text style={styles.shareButtonText}>Share Image</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(236, 253, 245, 0.8)",
    ...Platform.select({
      ios: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        shadowColor: "#10b981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      default: {
        backgroundColor: "#ffffff",
        elevation: 2,
      },
      web: {
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.06)",
      },
    }),
  },
  content: {
    flex: 1,
    gap: 8,
  },
  verseText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#374151",
    lineHeight: 24,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  reference: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  date: {
    fontSize: 13,
    color: "#94a3b8",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(226, 232, 240, 0.6)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10b981",
  },
  removeActionButton: {
    backgroundColor: "#fef2f2",
    marginLeft: "auto",
    paddingHorizontal: 10,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      default: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 20,
  },
  viewShotContainer: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      default: {
        elevation: 4,
      },
    }),
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  shareButton: {
    backgroundColor: "#10b981",
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});

