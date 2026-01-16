import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { InteractionManager } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithApple: (identityToken: string) => Promise<{ error?: string }>;
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
    await supabase.auth.signOut();
  }, []);

  const signInWithGoogle = useCallback(async () => {
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

  const signInWithApple = useCallback(async (identityToken: string) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: identityToken,
      });
      if (error) {
        return { error: error.message };
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
