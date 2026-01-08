import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AuthButtonProps {
  type: "apple" | "google" | "email";
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AuthButton({ type, onPress, loading, disabled }: AuthButtonProps) {
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={type === "apple" ? "#fff" : "#333"} size="small" />;
    }

    switch (type) {
      case "apple":
        return (
          <>
            <Ionicons name="logo-apple" size={24} color="#ffffff" style={styles.icon} />
            <Text style={styles.appleText}>Continue with Apple</Text>
          </>
        );
      case "google":
        return (
          <>
            <View style={styles.googleIconContainer}>
              <Text style={styles.googleIcon}>G</Text>
            </View>
            <Text style={styles.googleText}>Continue with Google</Text>
          </>
        );
      case "email":
        return (
          <>
            <Ionicons name="mail-outline" size={22} color="#374151" style={styles.icon} />
            <Text style={styles.emailText}>Continue with Email</Text>
          </>
        );
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case "apple":
        return styles.appleButton;
      case "google":
        return styles.googleButton;
      case "email":
        return styles.emailButton;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        getButtonStyle(),
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {renderContent()}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 14,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: 12,
  },
  // Apple Button - Black with white text (iOS standard)
  appleButton: {
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  appleText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  // Google Button - White with border and colorful G
  googleButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dadce0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleText: {
    color: "#1f1f1f",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.3,
  },
  // Email Button - Light gray background
  emailButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emailText: {
    color: "#374151",
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: -0.3,
  },
});
