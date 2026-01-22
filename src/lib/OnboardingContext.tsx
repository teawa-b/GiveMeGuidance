import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  saveOnboarding: () => Promise<void>;
  loadOnboarding: () => Promise<void>;
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

  // Load onboarding data from storage on mount
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

  // Update onboarding data
  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Save onboarding data to storage
  const saveOnboarding = useCallback(async () => {
    try {
      const dataToSave = {
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
      };
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(dataToSave));
      setData(dataToSave);
    } catch (error) {
      console.error("[Onboarding] Failed to save data:", error);
    }
  }, [data]);

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
