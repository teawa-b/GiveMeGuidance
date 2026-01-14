import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mediumHaptic, lightHaptic, errorHaptic } from "../lib/haptics";

interface EmailAuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export function EmailAuthForm({
  onSignIn,
  onSignUp,
  onBack,
  loading,
  error,
}: EmailAuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLocalError(null);

    if (!email.trim() || !password.trim()) {
      errorHaptic();
      setLocalError("Please fill in all fields");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      errorHaptic();
      setLocalError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      errorHaptic();
      setLocalError("Password must be at least 8 characters");
      return;
    }

    mediumHaptic();
    try {
      if (mode === "signin") {
        await onSignIn(email.trim(), password);
      } else {
        await onSignUp(email.trim(), password);
      }
    } catch (e) {
      // Error handled by parent
    }
  };

  const displayError = error || localError;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => {
        lightHaptic();
        onBack();
      }}>
        <Ionicons name="arrow-back" size={24} color="#6b7280" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {mode === "signin" ? "Welcome back" : "Create account"}
        </Text>
        <Text style={styles.subtitle}>
          {mode === "signin"
            ? "Sign in to access your saved guidance"
            : "Start your journey with biblical wisdom"}
        </Text>
      </View>

      {/* Error message */}
      {displayError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{displayError}</Text>
        </View>
      )}

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#9ca3af"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#9ca3af"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            editable={!loading}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9ca3af"
            />
          </Pressable>
        </View>

        {mode === "signup" && (
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#9ca3af"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              editable={!loading}
            />
          </View>
        )}

        {/* Submit button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitPressed,
            loading && styles.submitDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitText}>
              {mode === "signin" ? "Sign In" : "Create Account"}
            </Text>
          )}
        </Pressable>

        {/* Toggle mode */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {mode === "signin"
              ? "Don't have an account? "
              : "Already have an account? "}
          </Text>
          <Pressable
            onPress={() => {
              lightHaptic();
              setMode(mode === "signin" ? "signup" : "signin");
              setLocalError(null);
            }}
          >
            <Text style={styles.toggleLink}>
              {mode === "signin" ? "Sign up" : "Sign in"}
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 4,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#111827",
  },
  submitButton: {
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "600",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  toggleText: {
    color: "#6b7280",
    fontSize: 15,
  },
  toggleLink: {
    color: "#10b981",
    fontSize: 15,
    fontWeight: "600",
  },
});
