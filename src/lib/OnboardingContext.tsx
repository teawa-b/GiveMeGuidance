import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

// Onboarding data types
export type SpiritualGoal =
  | "prayer"
  | "bible"
  | "peace"
  | "discipline"
  | "healing"
  | "purpose"
  | "relationships"
  | "gratitude";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "custom";

export type GuidanceStyle = "gentle" | "direct" | "deep";

export interface OnboardingData {
  goalCategories: SpiritualGoal[];
  preferredTimeOfDay: TimeOfDay;
  customTime?: string; // HH:MM format
  preferredStyle: GuidanceStyle;
  prayerPromptEnabled: boolean;
  notificationEnabled: boolean;
  createdAt?: string;
  activationCompleted: boolean;
  onboardingCompleted: boolean;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;
  saveOnboarding: (overrides?: Partial<OnboardingData>) => Promise<void>;
  loadOnboarding: () => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  isOnboardingComplete: boolean;
  hasCompletedActivation: boolean;
}

const defaultOnboardingData: OnboardingData = {
  goalCategories: [],
  preferredTimeOfDay: "morning",
  customTime: undefined,
  preferredStyle: "gentle",
  prayerPromptEnabled: true,
  notificationEnabled: false,
  createdAt: undefined,
  activationCompleted: false,
  onboardingCompleted: false,
};

const ONBOARDING_STORAGE_KEY = "@onboarding_data";

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [isLoaded, setIsLoaded] = useState(false);
  const isSyncing = useRef(false);

  // Load preferences from Supabase for authenticated user
  const loadFromSupabase = useCallback(async (userId: string): Promise<OnboardingData | null> => {
    try {
      const { data: prefs, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No row found - user hasn't saved preferences yet
          return null;
        }
        console.error("[Onboarding] Supabase load error:", error);
        return null;
      }

      if (prefs) {
        return {
          goalCategories: (prefs.goal_categories || []) as SpiritualGoal[],
          preferredTimeOfDay: (prefs.preferred_time_of_day || "morning") as TimeOfDay,
          customTime: prefs.custom_time || undefined,
          preferredStyle: (prefs.preferred_style || "gentle") as GuidanceStyle,
          prayerPromptEnabled: prefs.prayer_prompt_enabled ?? true,
          notificationEnabled: prefs.notification_enabled ?? false,
          createdAt: prefs.created_at,
          activationCompleted: prefs.activation_completed ?? false,
          onboardingCompleted: prefs.onboarding_completed ?? false,
        };
      }
      return null;
    } catch (error) {
      console.error("[Onboarding] Failed to load from Supabase:", error);
      return null;
    }
  }, []);

  // Save preferences to Supabase for authenticated user
  const saveToSupabase = useCallback(async (userId: string, onboardingData: OnboardingData) => {
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          goal_categories: onboardingData.goalCategories,
          preferred_time_of_day: onboardingData.preferredTimeOfDay,
          custom_time: onboardingData.customTime || null,
          preferred_style: onboardingData.preferredStyle,
          prayer_prompt_enabled: onboardingData.prayerPromptEnabled,
          notification_enabled: onboardingData.notificationEnabled,
          activation_completed: onboardingData.activationCompleted,
          onboarding_completed: onboardingData.onboardingCompleted,
        }, {
          onConflict: "user_id",
        });

      if (error) {
        console.error("[Onboarding] Supabase save error:", error);
      } else {
        console.log("[Onboarding] Saved to Supabase successfully");
      }
    } catch (error) {
      console.error("[Onboarding] Failed to save to Supabase:", error);
    }
  }, []);

  // Sync local data with Supabase (merges cloud data if newer)
  const syncWithSupabase = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        isSyncing.current = false;
        return;
      }

      // Load from Supabase
      const cloudData = await loadFromSupabase(user.id);

      if (cloudData) {
        // If cloud has data and local doesn't have completed onboarding, use cloud
        if (cloudData.onboardingCompleted && !data.onboardingCompleted) {
          setData(cloudData);
          await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(cloudData));
          console.log("[Onboarding] Loaded preferences from cloud");
        } else if (data.onboardingCompleted) {
          // Local has completed onboarding, sync to cloud
          await saveToSupabase(user.id, data);
        }
      } else if (data.onboardingCompleted) {
        // No cloud data but local has data, save to cloud
        await saveToSupabase(user.id, data);
      }
    } catch (error) {
      console.error("[Onboarding] Sync error:", error);
    } finally {
      isSyncing.current = false;
    }
  }, [data, loadFromSupabase, saveToSupabase]);

  // Load onboarding data from local storage on mount
  const loadOnboarding = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setData({ ...defaultOnboardingData, ...parsed });
      }
    } catch (error) {
      console.error("[Onboarding] Failed to load data:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadOnboarding();
  }, [loadOnboarding]);

  // Sync with Supabase when loaded and when auth state changes
  useEffect(() => {
    if (!isLoaded) return;

    // Initial sync
    syncWithSupabase();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // User just signed in, sync their preferences
        syncWithSupabase();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLoaded, syncWithSupabase]);

  // Update onboarding data
  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Save onboarding data to local storage and Supabase
  const saveOnboarding = useCallback(async (overrides: Partial<OnboardingData> = {}) => {
    try {
      const dataToSave = {
        ...data,
        ...overrides,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      
      // Save to local storage
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(dataToSave));
      setData(dataToSave);

      // Save to Supabase if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await saveToSupabase(user.id, dataToSave);
      }
    } catch (error) {
      console.error("[Onboarding] Failed to save data:", error);
    }
  }, [data, saveToSupabase]);

  // Reset onboarding
  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setData(defaultOnboardingData);
    } catch (error) {
      console.error("[Onboarding] Failed to reset data:", error);
    }
  }, []);

  const isOnboardingComplete = data.onboardingCompleted;
  const hasCompletedActivation = data.activationCompleted;

  return (
    <OnboardingContext.Provider
      value={{
        data,
        updateData,
        resetOnboarding,
        saveOnboarding,
        loadOnboarding,
        syncWithSupabase,
        isOnboardingComplete,
        hasCompletedActivation,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

// Helper to get goal display names
export const goalDisplayNames: Record<SpiritualGoal, string> = {
  prayer: "Build a daily prayer habit",
  bible: "Understand the Bible better",
  peace: "Find peace and reduce anxiety",
  discipline: "Beat temptation and grow discipline",
  healing: "Healing and forgiveness",
  purpose: "Purpose and direction",
  relationships: "Relationships",
  gratitude: "Gratitude and joy",
};

// Helper to get time display names
export const timeDisplayNames: Record<TimeOfDay, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  custom: "Custom time",
};

// Helper to get style display names
export const styleDisplayNames: Record<GuidanceStyle, string> = {
  gentle: "Gentle and encouraging",
  direct: "Straight to the point",
  deep: "Bible deep dive",
};

