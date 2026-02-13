import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../src/lib/AuthContext";
import { LandingScreen, LoginScreen, WarmBackground } from "../../src/components/onboarding";
import { EmailAuthForm } from "../../src/components/EmailAuthForm";
import { View, SafeAreaView, StyleSheet, Alert, Platform } from "react-native";

type AuthView = "landing" | "login" | "email";

export default function AuthIndex() {
  const router = useRouter();
  const { isAuthenticated, signIn, signUp } = useAuth();
  const [currentView, setCurrentView] = useState<AuthView>("landing");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Auto-redirect when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, router]);

  const handleGetStarted = () => {
    // Go to onboarding flow
    router.push("/(auth)/onboarding");
  };

  const handleSignIn = () => {
    setCurrentView("login");
  };

  const handleAuthenticated = () => {
    // Will be auto-redirected by useEffect
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 500);
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      setEmailLoading(true);
      setEmailError(null);
      const result = await signIn(email, password);
      if (result.error) {
        setEmailError(result.error);
        throw new Error(result.error);
      }
      handleAuthenticated();
    } catch (e: any) {
      if (!emailError) {
        setEmailError(e.message || "Invalid email or password");
      }
      throw e;
    } finally {
      setEmailLoading(false);
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    try {
      setEmailLoading(true);
      setEmailError(null);
      const result = await signUp(email, password);
      if (result.error) {
        setEmailError(result.error);
        throw new Error(result.error);
      }
      if (result.needsConfirmation) {
        const verificationMessage =
          "We've sent a verification link to your email. Please verify your email before signing in.";

        if (Platform.OS === "web" && typeof window !== "undefined") {
          window.alert(verificationMessage);
        } else {
          Alert.alert("Check your email", verificationMessage);
        }
        return;
      }

      handleAuthenticated();
    } catch (e: any) {
      if (!emailError) {
        setEmailError(e.message || "Could not create account");
      }
      throw e;
    } finally {
      setEmailLoading(false);
    }
  };

  if (currentView === "landing") {
    return (
      <LandingScreen
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
      />
    );
  }

  if (currentView === "email") {
    return (
      <View style={styles.container}>
        <WarmBackground />
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <EmailAuthForm
              onSignIn={handleEmailSignIn}
              onSignUp={handleEmailSignUp}
              onBack={() => {
                setCurrentView("login");
                setEmailError(null);
              }}
              loading={emailLoading}
              error={emailError}
            />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <LoginScreen
      onBack={() => setCurrentView("landing")}
      onAuthenticated={handleAuthenticated}
      onEmailPress={() => {
        setEmailError(null);
        setCurrentView("email");
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8F0",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
});


