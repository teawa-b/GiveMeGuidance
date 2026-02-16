import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { InteractionManager, Platform } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// --- Google Sign-In: only import on native (crashes on web due to missing native module) ---
let GoogleSignin: any = null;
let isSuccessResponse: any = () => false;
let isErrorWithCode: any = () => false;
let statusCodes: any = {};

if (Platform.OS !== "web") {
  try {
    const gsi = require("@react-native-google-signin/google-signin");
    GoogleSignin = gsi.GoogleSignin;
    isSuccessResponse = gsi.isSuccessResponse;
    isErrorWithCode = gsi.isErrorWithCode;
    statusCodes = gsi.statusCodes;
  } catch (e) {
    console.warn("[Auth] Google Sign-In module not available:", e);
  }
}

// âš ï¸ IMPORTANT: Replace these with your actual Google OAuth Client IDs from Google Cloud Console
// Get these from: https://console.cloud.google.com/apis/credentials
const GOOGLE_WEB_CLIENT_ID = (process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "").trim();
const GOOGLE_IOS_CLIENT_ID = (process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "").trim();

const isInvalidGoogleClientId = (value: string) => {
  if (!value) return true;
  if (value.includes("YOUR_")) return true;
  return !value.endsWith(".apps.googleusercontent.com");
};

const hasValidGoogleWebClientId = !isInvalidGoogleClientId(GOOGLE_WEB_CLIENT_ID);
const hasValidGoogleIosClientId = !isInvalidGoogleClientId(GOOGLE_IOS_CLIENT_ID);

// Configure Google Sign In (only on native platforms)
if (Platform.OS !== "web" && GoogleSignin) {
  try {
    GoogleSignin.configure({
      webClientId: hasValidGoogleWebClientId ? GOOGLE_WEB_CLIENT_ID : undefined,
      iosClientId: hasValidGoogleIosClientId ? GOOGLE_IOS_CLIENT_ID : undefined,
      offlineAccess: hasValidGoogleWebClientId,
    });
  } catch (e) {
    console.warn("[Auth] Failed to configure Google Sign-In:", e);
  }
}

interface AppleFullName {
  givenName?: string | null;
  middleName?: string | null;
  familyName?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithApple: (identityToken: string, fullName?: AppleFullName | null) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        // Wait for interactions to complete to ensure React Native is ready
        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => {
            resolve();
          });
        });

        // Small delay to ensure native modules are fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted) return;

        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setIsLoading(false);
        }

        // Listen for auth changes
        const { data } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!isMounted) return;
            console.log("[Auth] State changed:", event, newSession?.user?.email);
            setSession(newSession);
            setUser(newSession?.user ?? null);
            setIsLoading(false);
          }
        );
        subscription = data.subscription;
      } catch (error) {
        console.error("[Auth] Initialization error:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (e: any) {
      return { error: e.message || "Sign in failed" };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        return { error: error.message };
      }
      // Check if email confirmation is required
      // If user exists but session is null, email confirmation is needed
      if (data.user && !data.session) {
        return { needsConfirmation: true };
      }
      return {};
    } catch (e: any) {
      return { error: e.message || "Sign up failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    // Sign out from Google if signed in (native platforms only)
    if (Platform.OS !== "web" && GoogleSignin) {
      try {
        const isSignedIn = await GoogleSignin.hasPreviousSignIn();
        if (isSignedIn) {
          await GoogleSignin.signOut();
        }
      } catch (e) {
        // Ignore Google sign out errors
        console.warn("[Auth] Google sign out error:", e);
      }
    }
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Use native Google Sign-In on iOS and Android
    if (Platform.OS !== "web" && GoogleSignin) {
      if (!hasValidGoogleWebClientId) {
        return {
          error:
            "Google sign in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.",
        };
      }

      if (Platform.OS === "ios" && !hasValidGoogleIosClientId) {
        return {
          error:
            "Google sign in is not configured for iOS. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.",
        };
      }

      try {
        if (Platform.OS === "android" && GoogleSignin.hasPlayServices) {
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        }

        // Sign in with Google natively
        const response = await GoogleSignin.signIn();

        const isSuccess =
          isSuccessResponse(response) ||
          response?.type === "success" ||
          !!response?.data?.idToken ||
          !!response?.idToken;

        if (isSuccess) {
          const idToken = response?.data?.idToken || response?.idToken;

          if (!idToken) {
            console.error("[Auth] No ID token received from Google");
            return { error: "No ID token received from Google" };
          }

          console.log("[Auth] Got Google ID token, signing in with Supabase...");

          // Sign in with Supabase using the Google ID token
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: idToken,
          });

          if (error) {
            console.error("[Auth] Supabase Google auth error:", error);
            return { error: error.message };
          }

          console.log("[Auth] Google sign in successful:", data.user?.email);
          return {};
        } else {
          // User cancelled
          return {};
        }
      } catch (e: any) {
        if (isErrorWithCode(e)) {
          switch (e.code) {
            case statusCodes.IN_PROGRESS:
              return { error: "Sign in already in progress" };
            case statusCodes.SIGN_IN_CANCELLED:
              // User cancelled - don't show error
              return {};
            default:
              console.error("[Auth] Google sign in error:", e);
              return { error: "Google sign in failed. Please try again." };
          }
        }
        console.error("[Auth] Google sign in error:", e);
        return { error: e.message || "Google sign in failed" };
      }
    }

    if (Platform.OS !== "web" && !GoogleSignin) {
      return { error: "Google Sign-In native module is not available in this build." };
    }

    // Fallback to OAuth flow for web/other platforms
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (e: any) {
      return { error: e.message || "Google sign in failed" };
    }
  }, []);

  const signInWithApple = useCallback(async (identityToken: string, fullName?: AppleFullName | null) => {
    try {
      const { error, data } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });
      if (error) {
        return { error: error.message };
      }

      // Apple only provides the user's full name on the FIRST sign-in
      // We must capture it from the credential and save it to user metadata
      if (fullName && data.user) {
        const nameParts: string[] = [];
        if (fullName.givenName) nameParts.push(fullName.givenName);
        if (fullName.middleName) nameParts.push(fullName.middleName);
        if (fullName.familyName) nameParts.push(fullName.familyName);

        if (nameParts.length > 0) {
          const fullNameStr = nameParts.join(" ");
          await supabase.auth.updateUser({
            data: {
              full_name: fullNameStr,
              given_name: fullName.givenName,
              family_name: fullName.familyName,
            },
          });
          console.log("[Auth] Saved Apple user full name:", fullNameStr);
        }
      }

      return {};
    } catch (e: any) {
      return { error: e.message || "Apple sign in failed" };
    }
  }, []);

  const value: AuthContextType = {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

